import { simulateBracket } from '../engine/bracket'
import { playerById } from '../engine/data/rosters'
import type { Player } from '../engine/types'
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

    const bracket = simulateBracket(team, day.date)
    let campaignPoints = 0
    for (const round of bracket.rounds) {
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
  }
}
