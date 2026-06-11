import { describe, it, expect } from 'vitest'
import { POSITIONS, type PlayerRatings } from '../types'
import { PLAYERS, PLAYERS_BY_POSITION } from './players'

const RATING_KEYS: readonly (keyof PlayerRatings)[] = [
  'speed',
  'shooting',
  'threePoint',
  'defense',
  'passing',
  'rebounding',
  'clutch',
]

describe('pool de jogadores', () => {
  it('tem pelo menos 20 jogadores por posição', () => {
    for (const pos of POSITIONS) {
      expect(PLAYERS_BY_POSITION[pos].length).toBeGreaterThanOrEqual(20)
    }
  })

  it('tem ~100 jogadores no total', () => {
    expect(PLAYERS.length).toBeGreaterThanOrEqual(100)
  })

  it('tem ids e nomes únicos', () => {
    const ids = new Set(PLAYERS.map((p) => p.id))
    const names = new Set(PLAYERS.map((p) => p.name))
    expect(ids.size).toBe(PLAYERS.length)
    expect(names.size).toBe(PLAYERS.length)
  })

  it('todos os ratings são inteiros em 0–100', () => {
    for (const player of PLAYERS) {
      for (const key of RATING_KEYS) {
        const value = player.ratings[key]
        expect(Number.isInteger(value), `${player.name}.${key}`).toBe(true)
        expect(value, `${player.name}.${key}`).toBeGreaterThanOrEqual(0)
        expect(value, `${player.name}.${key}`).toBeLessThanOrEqual(100)
      }
    }
  })
})
