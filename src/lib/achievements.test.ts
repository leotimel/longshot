import { describe, it, expect } from 'vitest'
import { ACH_CATEGORIES, computeAchievements } from './achievements'
import type { Stats } from './storage'

const base: Stats = {
  streak: 0,
  bestStreak: 0,
  badges: [0, 0, 0, 0],
  freezes: 0,
  history: {},
}

describe('computeAchievements', () => {
  it('jogador novo (sem histórico, sem gauntlet): nada desbloqueado, ids únicos', () => {
    const ach = computeAchievements(base, undefined, 0)
    expect(ach.length).toBeGreaterThanOrEqual(25)
    expect(ach.every((a) => !a.done)).toBe(true)
    expect(new Set(ach.map((a) => a.id)).size).toBe(ach.length)
  })

  it('toda conquista tem uma categoria válida', () => {
    const valid = new Set(ACH_CATEGORIES.map((c) => c.id))
    for (const a of computeAchievements(base, undefined, 0)) {
      expect(valid.has(a.category)).toBe(true)
    }
  })

  it('metas de streak são puras (não dependem de re-simular)', () => {
    const ach = computeAchievements({ ...base, bestStreak: 30 }, undefined, 0)
    const byId = Object.fromEntries(ach.map((a) => [a.id, a]))
    expect(byId.maratona.done).toBe(true) // ≥7
    expect(byId.viciado.done).toBe(true) // ≥30
    expect(byId.estreia.done).toBe(false) // sem dias no histórico
  })

  it('recorde do Gauntlet desbloqueia os marcos correspondentes', () => {
    const ach = computeAchievements(base, undefined, 10)
    const byId = Object.fromEntries(ach.map((a) => [a.id, a]))
    expect(byId.gauntletWin.done).toBe(true) // ≥1
    expect(byId.gauntlet5.done).toBe(true) // ≥5
    expect(byId.gauntlet10.done).toBe(true) // ≥10
    expect(byId.gauntlet20.done).toBe(false) // <20
    expect(byId.gauntlet20.progressLabel).toBe('10/20')
  })
})
