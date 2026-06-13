import { describe, it, expect } from 'vitest'
import { POSITIONS, type Player } from './types'
import { PLAYERS_BY_POSITION } from './data/players'
import { TEAMS } from './data/teams'
import { simulateSeries } from './series'

const team: Player[] = POSITIONS.map((pos) => PLAYERS_BY_POSITION[pos][0])
const opponent = TEAMS[0]

describe('simulateSeries', () => {
  it('é determinística: mesma baseSeed → mesma série', () => {
    expect(simulateSeries(team, opponent, 42)).toEqual(
      simulateSeries(team, opponent, 42),
    )
  })

  it('termina sempre entre 4 e 7 jogos; o vencedor tem exatamente 4 vitórias', () => {
    for (let s = 1; s <= 200; s++) {
      const r = simulateSeries(team, opponent, s)
      expect(r.games.length).toBeGreaterThanOrEqual(4)
      expect(r.games.length).toBeLessThanOrEqual(7)
      expect(r.gamesWon + r.gamesLost).toBe(r.games.length)
      const winnerWins = r.winner === 'player' ? r.gamesWon : r.gamesLost
      const loserWins = r.winner === 'player' ? r.gamesLost : r.gamesWon
      expect(winnerWins).toBe(4)
      expect(loserWins).toBeLessThan(4)
    }
  })

  it('cada jogo é decisivo (sem empate) e a contagem bate com o vencedor', () => {
    const r = simulateSeries(team, opponent, 7)
    let playerGameWins = 0
    for (const g of r.games) {
      expect(g.homeScore).not.toBe(g.awayScore)
      if (g.homeScore > g.awayScore) playerGameWins++
    }
    expect(playerGameWins).toBe(r.gamesWon)
  })
})
