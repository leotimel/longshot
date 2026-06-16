import type { BracketResult, Player, PlayerRatings } from '../engine/types'

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))

/**
 * "Índice de craque" — overall de exibição de um jogador.
 *
 * Média dos 5 maiores ratings (descarta os 2 piores, ex. 3pt de pivô, que afundam
 * lendas defensivas/antigas), reescalada para dar impacto: craques passam de 90 e
 * reservas ficam nos 60. É cálculo puro de UI; o motor segue lendo os ratings crus.
 */
export function overall(p: Player): number {
  const sorted = Object.values(p.ratings).sort((a, b) => b - a)
  const best5 = (sorted[0] + sorted[1] + sorted[2] + sorted[3] + sorted[4]) / 5
  return clamp(Math.round(1.35 * best5 - 25.5), 40, 99)
}

/** O atributo que mais se destaca num jogador (rating mais alto). */
export function bestRating(p: Player): { key: keyof PlayerRatings; value: number } {
  const entries = Object.entries(p.ratings) as [keyof PlayerRatings, number][]
  let best = entries[0]
  for (const e of entries) if (e[1] > best[1]) best = e
  return { key: best[0], value: best[1] }
}

/** Estatísticas de um jogador ao longo de UMA campanha (o playoff do dia). */
export interface PlayerCampaign {
  playerId: string
  name: string
  points: number
  games: number
  ppg: number
  best: number
}

export interface CampaignStats {
  byPlayer: Map<string, PlayerCampaign>
  mvpId: string | null
  totalPoints: number
  /** Pontos sofridos (soma do placar adversário). */
  pointsAgainst: number
  totalGames: number
  /** Jogos vencidos na campanha. */
  gamesWon: number
  /** Maior margem de vitória num único jogo (0 se nunca venceu). */
  biggestWin: number
  recordGame: { playerId: string; name: string; points: number } | null
}

/**
 * Agrega os box scores de todos os jogos da campanha (todas as rodadas) por jogador:
 * pontos totais, jogos, PPG, maior jogo; além de MVP (cestinha), totais, saldo,
 * jogos vencidos, maior vitória e recorde.
 */
export function campaignStats(bracket: BracketResult): CampaignStats {
  const byPlayer = new Map<string, PlayerCampaign>()
  let totalGames = 0
  let pointsAgainst = 0
  let gamesWon = 0
  let biggestWin = 0
  let recordGame: CampaignStats['recordGame'] = null

  for (const round of bracket.rounds) {
    for (const game of round.games) {
      totalGames += 1
      pointsAgainst += game.awayScore
      const margin = game.homeScore - game.awayScore
      if (margin > 0) {
        gamesWon += 1
        if (margin > biggestWin) biggestWin = margin
      }
      for (const e of game.boxScore) {
        const cur =
          byPlayer.get(e.playerId) ??
          { playerId: e.playerId, name: e.name, points: 0, games: 0, ppg: 0, best: 0 }
        cur.points += e.points
        cur.games += 1
        cur.best = Math.max(cur.best, e.points)
        byPlayer.set(e.playerId, cur)
        if (!recordGame || e.points > recordGame.points) {
          recordGame = { playerId: e.playerId, name: e.name, points: e.points }
        }
      }
    }
  }

  let mvpId: string | null = null
  let totalPoints = 0
  let bestTotal = -1
  for (const c of byPlayer.values()) {
    c.ppg = c.games > 0 ? c.points / c.games : 0
    totalPoints += c.points
    if (c.points > bestTotal) {
      bestTotal = c.points
      mvpId = c.playerId
    }
  }

  return { byPlayer, mvpId, totalPoints, pointsAgainst, totalGames, gamesWon, biggestWin, recordGame }
}
