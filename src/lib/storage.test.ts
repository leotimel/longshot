// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  confirmDay,
  getDay,
  getGauntletProfile,
  getGauntletRecord,
  getGauntletStats,
  getPlayerSeed,
  hasOnboarded,
  isLocked,
  loadStats,
  recordGauntletMeta,
  recordGauntletRun,
  setGauntletCaptain,
  setOnboarded,
  type DayRecord,
} from './storage'

const rec = (date: string, badge: number | null, champion = false): DayRecord => ({
  date,
  team: ['a', 'b', 'c', 'd', 'e'],
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

  it('ganha escudo a cada 10 dias e o escudo tolera uma lacuna', () => {
    for (let i = 1; i <= 10; i++) confirmDay(rec(`2026-06-${String(i).padStart(2, '0')}`, 0))
    expect(loadStats().streak).toBe(10)
    expect(loadStats().freezes).toBe(1) // 1 escudo no 10º dia

    // Pula o dia 11, joga o 12 → o escudo cobre a lacuna; streak segue.
    confirmDay(rec('2026-06-12', 0))
    const s = loadStats()
    expect(s.streak).toBe(11)
    expect(s.freezes).toBe(0) // consumiu o escudo
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

describe('gauntlet stats', () => {
  it('registra runs, soma rodadas e guarda o recorde', () => {
    expect(getGauntletStats()).toEqual({ runs: 0, totalRounds: 0, best: 0 })
    recordGauntletRun(4)
    recordGauntletRun(7)
    recordGauntletRun(2)
    expect(getGauntletStats()).toEqual({ runs: 3, totalRounds: 13, best: 7 })
    expect(getGauntletRecord()).toBe(7)
  })

  it('ignora placares antigos (v1/v2) — reiniciado na v3', () => {
    localStorage.setItem('longshot:gauntlet:v1', '9')
    localStorage.setItem('longshot:gauntlet:v2', JSON.stringify({ runs: 3, totalRounds: 30, best: 55 }))
    expect(getGauntletStats()).toEqual({ runs: 0, totalRounds: 0, best: 0 })
    expect(getGauntletRecord()).toBe(0)
  })
})

describe('gauntlet captain/profile', () => {
  it('capitão: escolha grava e progresso acumula; bestRanked só em Padrão+', () => {
    expect(getGauntletProfile().captain).toBeNull()
    setGauntletCaptain('jordan')
    expect(getGauntletProfile().captain?.id).toBe('jordan')

    // intensidade 0 (Tranquilo) não conta pro bestRanked, mas o capitão acumula
    recordGauntletMeta({ cleared: 40, intensity: 0, captain: { bossWins: 1, bestGame: 30 } })
    let prof = getGauntletProfile()
    expect(prof.bestRanked).toBe(0)
    expect(prof.captain?.roundsWith).toBe(40)
    expect(prof.captain?.bossWins).toBe(1)

    // intensidade ≥ 1 conta pro bestRanked
    recordGauntletMeta({ cleared: 52, intensity: 1, captain: { bossWins: 2, bestGame: 55 } })
    prof = getGauntletProfile()
    expect(prof.bestRanked).toBe(52)
    expect(prof.captain?.roundsWith).toBe(92)
    expect(prof.captain?.bestGame).toBe(55)
    expect(prof.captain?.bestRound).toBe(52)
  })
})
