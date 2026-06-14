import { describe, it, expect } from 'vitest'
import { POSITIONS, type PlayerRatings } from '../types'
import { TEAMS } from './teams'
import { ROSTERS, playerById } from './rosters'

const RATING_KEYS: readonly (keyof PlayerRatings)[] = [
  'speed',
  'shooting',
  'threePoint',
  'defense',
  'passing',
  'rebounding',
  'clutch',
]

describe('rosters', () => {
  it('todo time de TEAMS tem um elenco', () => {
    for (const t of TEAMS) {
      expect(ROSTERS[t.id], t.id).toBeDefined()
    }
  })

  it('cada elenco tem 5 jogadores, um por posição', () => {
    for (const [teamId, roster] of Object.entries(ROSTERS)) {
      expect(roster, teamId).toHaveLength(5)
      expect(roster.map((p) => p.position).sort()).toEqual([...POSITIONS].sort())
    }
  })

  it('ids são únicos globalmente', () => {
    const ids = Object.values(ROSTERS)
      .flat()
      .map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todos os ratings são inteiros em 0–100', () => {
    for (const player of Object.values(ROSTERS).flat()) {
      for (const k of RATING_KEYS) {
        const v = player.ratings[k]
        expect(Number.isInteger(v), `${player.id}.${k}`).toBe(true)
        expect(v, `${player.id}.${k}`).toBeGreaterThanOrEqual(0)
        expect(v, `${player.id}.${k}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('playerById recupera o jogador', () => {
    const first = Object.values(ROSTERS)[0][0]
    expect(playerById(first.id)?.name).toBe(first.name)
    expect(playerById('nao-existe')).toBeUndefined()
  })
})
