import { describe, it, expect } from 'vitest'
import type { TeamRatings } from '../types'
import { TEAMS } from './teams'

const RATING_KEYS: readonly (keyof TeamRatings)[] = [
  'offense',
  'defense',
  'pace',
  'threePointRate',
  'clutch',
]

describe('times históricos', () => {
  it('tem ~50 times', () => {
    expect(TEAMS.length).toBeGreaterThanOrEqual(50)
  })

  it('tem ids únicos e pares (nome, temporada) únicos', () => {
    const ids = new Set(TEAMS.map((t) => t.id))
    const pairs = new Set(TEAMS.map((t) => `${t.name}__${t.season}`))
    expect(ids.size).toBe(TEAMS.length)
    expect(pairs.size).toBe(TEAMS.length)
  })

  it('tem nome, temporada e descrição não-vazios', () => {
    for (const t of TEAMS) {
      expect(t.name.length, t.id).toBeGreaterThan(0)
      expect(t.season.length, t.id).toBeGreaterThan(0)
      expect(t.description.length, t.id).toBeGreaterThan(0)
    }
  })

  it('todos os teamRatings são inteiros em 0–100', () => {
    for (const t of TEAMS) {
      for (const key of RATING_KEYS) {
        const v = t.teamRatings[key]
        expect(Number.isInteger(v), `${t.id}.${key}`).toBe(true)
        expect(v, `${t.id}.${key}`).toBeGreaterThanOrEqual(0)
        expect(v, `${t.id}.${key}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('é calibrado: forte mas não invencível, com spread', () => {
    const allRatings = TEAMS.flatMap((t) => Object.values(t.teamRatings))
    // Nenhum time é invencível.
    expect(Math.max(...allRatings)).toBeLessThanOrEqual(97)
    // Existe juggernaut e existe time batível (spread de calibração).
    expect(TEAMS.some((t) => t.teamRatings.offense >= 90)).toBe(true)
    expect(TEAMS.some((t) => t.teamRatings.offense <= 80)).toBe(true)
  })
})
