import { simulateBracket } from '../engine/bracket'
import { dailyDraft } from '../engine/draft'
import { playerById } from '../engine/data/rosters'
import type { Player } from '../engine/types'
import { isPerfectRun } from './playerStats'
import type { DayRecord } from './storage'

/** Estatísticas acumuladas de um jogador ao longo de todos os dias jogados. */
export interface PlayerCareer {
  playerId: string
  name: string
  picks: number
  points: number
  games: number
  ppg: number
  bestGame: number
}

export interface HistorySummary {
  scorers: PlayerCareer[] // ordenado por pontos totais (desc)
  distinctPlayers: number
  favorite: PlayerCareer | null // mais escalado
  totalPoints: number
  daysPlayed: number
  recordGame: { name: string; points: number; date: string } | null
  bestCampaign: { points: number; date: string } | null
  /** Temporadas invictas (16-0) acumuladas. */
  perfectRuns: number
  /** Séries vencidas após perder os 2 primeiros jogos (0-2). */
  comebacks: number
  /** Jogos-jogador com duplo-duplo (≥2 entre pts/reb/ast ≥10). */
  doubleDoubles: number
  /** Séries vencidas contra um time juggernaut (ataque e defesa de elite). */
  davidWins: number
}

/**
 * Re-simula cada dia do histórico (determinístico) e acumula, por jogador, quantas
 * vezes foi escalado, pontos/jogos somando tudo, e o maior jogo. Tudo derivado de
 * `Stats.history` — nenhum estado novo é persistido. Resiliente a ids não resolvidos.
 */
export function summarizeHistory(history: Record<string, DayRecord>): HistorySummary {
  const byId = new Map<string, PlayerCareer>()
  let totalPoints = 0
  let daysPlayed = 0
  let perfectRuns = 0
  let comebacks = 0
  let doubleDoubles = 0
  let davidWins = 0
  let recordGame: HistorySummary['recordGame'] = null
  let bestCampaign: HistorySummary['bestCampaign'] = null

  const days = Object.values(history).sort((a, b) => a.date.localeCompare(b.date))

  for (const day of days) {
    const team = day.team
      .map((id) => playerById(id))
      .filter((p): p is Player => p !== undefined)
    if (team.length !== day.team.length) continue // dia com id não resolvido → pula

    daysPlayed += 1
    for (const p of team) {
      const cur =
        byId.get(p.id) ??
        { playerId: p.id, name: p.name, picks: 0, points: 0, games: 0, ppg: 0, bestGame: 0 }
      cur.picks += 1
      byId.set(p.id, cur)
    }

    const sixthMan = day.sixthManId ? playerById(day.sixthManId) : undefined
    const bracket = simulateBracket(team, day.date, day.tactics, sixthMan)
    if (isPerfectRun(bracket)) perfectRuns += 1
    const opponents = dailyDraft(day.date).bracket // alinhado a bracket.rounds
    let campaignPoints = 0
    for (let ri = 0; ri < bracket.rounds.length; ri++) {
      const round = bracket.rounds[ri]

      // Virada (0-2): perdeu os 2 primeiros jogos e ainda venceu a série.
      if (
        round.winner === 'player' &&
        round.games.length >= 2 &&
        round.games[0].homeScore < round.games[0].awayScore &&
        round.games[1].homeScore < round.games[1].awayScore
      ) {
        comebacks += 1
      }

      // Davi vs Golias: venceu uma série de um time com ataque E defesa de elite.
      const opp = opponents[ri]
      if (round.winner === 'player' && opp && opp.teamRatings.offense >= 92 && opp.teamRatings.defense >= 90) {
        davidWins += 1
      }

      for (const game of round.games) {
        for (const e of game.boxScore) {
          const cur = byId.get(e.playerId)
          if (!cur) continue
          cur.points += e.points
          cur.games += 1
          cur.bestGame = Math.max(cur.bestGame, e.points)
          totalPoints += e.points
          campaignPoints += e.points
          if (!recordGame || e.points > recordGame.points) {
            recordGame = { name: e.name, points: e.points, date: day.date }
          }
          const cats = (e.points >= 10 ? 1 : 0) + (e.rebounds >= 10 ? 1 : 0) + (e.assists >= 10 ? 1 : 0)
          if (cats >= 2) doubleDoubles += 1
        }
      }
    }
    if (!bestCampaign || campaignPoints > bestCampaign.points) {
      bestCampaign = { points: campaignPoints, date: day.date }
    }
  }

  const careers = [...byId.values()]
  for (const c of careers) c.ppg = c.games > 0 ? c.points / c.games : 0

  const scorers = [...careers].sort((a, b) => b.points - a.points)
  const favorite = careers.reduce<PlayerCareer | null>(
    (best, c) => (best === null || c.picks > best.picks ? c : best),
    null,
  )

  return {
    scorers,
    distinctPlayers: careers.length,
    favorite,
    totalPoints,
    daysPlayed,
    recordGame,
    bestCampaign,
    perfectRuns,
    comebacks,
    doubleDoubles,
    davidWins,
  }
}
