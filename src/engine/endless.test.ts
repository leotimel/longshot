import { describe, it, expect } from 'vitest'
import type { HistoricalTeam } from './types'
import { ROSTERS } from './data/rosters'
import { GAUNTLET_WINS, endlessOpponent, simulateGauntletRound } from './endless'

const team = ROSTERS['bulls-1996']
const power = (t: HistoricalTeam): number =>
  t.teamRatings.offense + t.teamRatings.defense + t.teamRatings.clutch

describe('gauntlet (endless)', () => {
  it('determinístico: mesma seed + rodada → mesma série', () => {
    expect(simulateGauntletRound(team, 42, 5)).toEqual(simulateGauntletRound(team, 42, 5))
  })

  it('cada rodada é melhor de 3 (vencedor com 2 vitórias, ≤3 jogos)', () => {
    for (let r = 0; r < 12; r++) {
      const s = simulateGauntletRound(team, 7, r)
      expect(s.games.length).toBeLessThanOrEqual(2 * GAUNTLET_WINS - 1)
      expect(Math.max(s.gamesWon, s.gamesLost)).toBe(GAUNTLET_WINS)
    }
  })

  it('escala de força: rodadas avançadas são mais difíceis, ratings ≤ 99', () => {
    expect(power(endlessOpponent(1, 45))).toBeGreaterThan(power(endlessOpponent(1, 0)))
    const deep = endlessOpponent(1, 80).teamRatings
    expect(deep.offense).toBeLessThanOrEqual(99)
    expect(deep.defense).toBeLessThanOrEqual(99)
    expect(deep.clutch).toBeLessThanOrEqual(99)
  })

  it('boost/attempt: default inalterado; retry re-sorteia a mesma rodada', () => {
    const a = simulateGauntletRound(team, 99, 3)
    expect(simulateGauntletRound(team, 99, 3, undefined, 0)).toEqual(a) // default == sem params
    expect(JSON.stringify(simulateGauntletRound(team, 99, 3, undefined, 1))).not.toBe(JSON.stringify(a))
  })

  it('boost (boons) nunca reduz as vitórias do time nas mesmas seeds', () => {
    let baseWins = 0
    let boostWins = 0
    const boost = { make: 0.06, clutch: 15, defense: 10 } // sem pace (não muda o nº de posses)
    for (let r = 0; r < 20; r++) {
      if (simulateGauntletRound(team, 5, r).winner === 'player') baseWins += 1
      if (simulateGauntletRound(team, 5, r, boost).winner === 'player') boostWins += 1
    }
    expect(boostWins).toBeGreaterThanOrEqual(baseWins)
  })
})
