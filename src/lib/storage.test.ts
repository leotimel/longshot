// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  confirmDay,
  getDay,
  getPlayerSeed,
  hasOnboarded,
  isLocked,
  loadStats,
  setOnboarded,
  type DayRecord,
} from './storage'

const rec = (date: string, badge: number | null, champion = false): DayRecord => ({
  date,
  picks: [0, 1, 0, 1, 0],
  finalRound: badge === null ? 1 : badge + 1,
  champion,
  badge,
})

beforeEach(() => localStorage.clear())

describe('storage', () => {
  it('trava o dia ao confirmar e não re-grava', () => {
    expect(isLocked('2026-06-13')).toBe(false)
    confirmDay(rec('2026-06-13', 0))
    expect(isLocked('2026-06-13')).toBe(true)
    expect(getDay('2026-06-13')?.badge).toBe(0)

    // Re-confirmar o mesmo dia não muda nada (draft travado).
    const before = loadStats()
    confirmDay({ ...rec('2026-06-13', 3), champion: true })
    expect(getDay('2026-06-13')?.badge).toBe(0)
    expect(loadStats()).toEqual(before)
  })

  it('streak incrementa em dias consecutivos e reseta com lacuna', () => {
    confirmDay(rec('2026-06-10', 0))
    expect(loadStats().streak).toBe(1)
    confirmDay(rec('2026-06-11', 1))
    expect(loadStats().streak).toBe(2)
    confirmDay(rec('2026-06-12', 0))
    expect(loadStats().streak).toBe(3)

    // Pula o dia 13, joga o 14 → reseta para 1; melhor streak mantém 3.
    confirmDay(rec('2026-06-14', 0))
    const s = loadStats()
    expect(s.streak).toBe(1)
    expect(s.bestStreak).toBe(3)
  })

  it('selos acumulam por tipo; eliminação no First Round não dá selo', () => {
    confirmDay(rec('2026-06-10', 0)) // 🥉
    confirmDay(rec('2026-06-11', 0)) // 🥉
    confirmDay(rec('2026-06-12', 3, true)) // 🏆
    confirmDay(rec('2026-06-13', null)) // sem selo
    expect(loadStats().badges).toEqual([2, 0, 0, 1])
  })

  it('flag de onboarding: começa falso, persiste após marcar', () => {
    expect(hasOnboarded()).toBe(false)
    setOnboarded()
    expect(hasOnboarded()).toBe(true)
  })

  it('getPlayerSeed é estável e persiste', () => {
    const seed = getPlayerSeed()
    expect(seed).toBeTruthy()
    expect(getPlayerSeed()).toBe(seed)
  })

  it('resiliente a localStorage corrompido', () => {
    localStorage.setItem('longshot:v1', '{ não é json')
    expect(loadStats().history).toEqual({})
    expect(loadStats().streak).toBe(0)
  })
})
