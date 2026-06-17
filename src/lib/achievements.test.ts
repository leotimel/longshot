import { describe, it, expect } from 'vitest'
import { computeAchievements } from './achievements'
import type { Stats } from './storage'

const base: Stats = {
  streak: 0,
  bestStreak: 0,
  badges: [0, 0, 0, 0],
  freezes: 0,
  history: {},
}

describe('computeAchievements', () => {
  it('jogador novo (sem histórico): nada desbloqueado, ids únicos', () => {
    const ach = computeAchievements(base)
    expect(ach.length).toBeGreaterThanOrEqual(12)
    expect(ach.every((a) => !a.done)).toBe(true)
    expect(new Set(ach.map((a) => a.id)).size).toBe(ach.length)
  })

  it('metas de streak são puras (não dependem de re-simular)', () => {
    const ach = computeAchievements({ ...base, bestStreak: 30 })
    const byId = Object.fromEntries(ach.map((a) => [a.id, a]))
    expect(byId.maratona.done).toBe(true) // ≥7
    expect(byId.viciado.done).toBe(true) // ≥30
    expect(byId.estreia.done).toBe(false) // sem dias no histórico
  })

  it('metas cumulativas trazem progresso parcial', () => {
    const ach = computeAchievements({ ...base, bestStreak: 3 })
    const maratona = ach.find((a) => a.id === 'maratona')!
    expect(maratona.done).toBe(false)
    expect(maratona.progress).toBeCloseTo(3 / 7)
    expect(maratona.progressLabel).toBe('3/7')
  })
})
