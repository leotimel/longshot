import { describe, it, expect } from 'vitest'
import { POSITIONS, type Player } from './types'
import { PLAYERS_BY_POSITION } from './data/players'
import { TEAMS } from './data/teams'
import { simulateGame } from './sim'

// Time determinístico: o 1º jogador de cada posição. Adversário: um time fixo.
const team: Player[] = POSITIONS.map((pos) => PLAYERS_BY_POSITION[pos][0])
const opponent = TEAMS[0]
const boxSum = (box: { points: number }[]) =>
  box.reduce((sum, entry) => sum + entry.points, 0)

describe('simulateGame', () => {
  it('mesmo seed → mesmo resultado', () => {
    expect(simulateGame(team, opponent, 12345)).toEqual(
      simulateGame(team, opponent, 12345),
    )
  })

  it('seeds diferentes → resultados diferentes', () => {
    const a = simulateGame(team, opponent, 1)
    const b = simulateGame(team, opponent, 2)
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
  })

  it('placar sempre positivo', () => {
    for (let s = 1; s <= 50; s++) {
      const g = simulateGame(team, opponent, s * 7)
      expect(g.homeScore).toBeGreaterThan(0)
      expect(g.awayScore).toBeGreaterThan(0)
    }
  })

  it('box score soma == placar do time do jogador', () => {
    for (let s = 1; s <= 50; s++) {
      const g = simulateGame(team, opponent, s * 13)
      expect(boxSum(g.boxScore)).toBe(g.homeScore)
    }
  })

  it('box score cobre os 5 jogadores e há play-by-play resumido', () => {
    const g = simulateGame(team, opponent, 999)
    expect(g.boxScore).toHaveLength(team.length)
    expect(g.boxScore.map((e) => e.playerId)).toEqual(team.map((p) => p.id))
    expect(g.playByPlay.length).toBeGreaterThan(0)
    expect(g.playByPlay.length).toBeLessThanOrEqual(10)
  })

  it('simula rápido (100 jogos < 250ms)', () => {
    const start = performance.now()
    for (let s = 0; s < 100; s++) simulateGame(team, opponent, s)
    expect(performance.now() - start).toBeLessThan(250)
  })
})
