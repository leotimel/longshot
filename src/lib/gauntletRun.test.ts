import { describe, it, expect } from 'vitest'
import { gauntletAscension, isBossRound, isEventRound, roundModifier, roundPlan } from './gauntletRun'

describe('gauntletRun (dinâmicas)', () => {
  it('ascensão sobe a cada 10 de recorde', () => {
    expect(gauntletAscension(0)).toBe(0)
    expect(gauntletAscension(9)).toBe(0)
    expect(gauntletAscension(10)).toBe(1)
    expect(gauntletAscension(55)).toBe(5)
  })

  it('rodada-chefe a cada 5 (rounds 4, 9, 14…)', () => {
    expect(isBossRound(4)).toBe(true)
    expect(isBossRound(9)).toBe(true)
    expect(isBossRound(0)).toBe(false)
    expect(isBossRound(3)).toBe(false)
  })

  it('chefe é melhor de 5 e reforça; aposta soma ao bump', () => {
    const boss = roundPlan(1, 4, 0)
    expect(boss.isBoss).toBe(true)
    expect(boss.wins).toBe(3)
    expect(boss.opponentBump).toBeGreaterThan(0)

    const base = roundPlan(1, 1, 0).opponentBump
    expect(roundPlan(1, 1, 0, true).opponentBump).toBeGreaterThan(base) // aposta
  })

  it('ascensão NÃO pesa na rodada 1, mas pesa no fundo (rampa)', () => {
    // rodada 0: ascensão não soma (só o modificador, igual nos dois) → rodada 1 sempre justa.
    expect(roundPlan(1, 0, 5).opponentBump).toBe(roundPlan(1, 0, 0).opponentBump)
    // rodada funda: ascensão alta deixa bem mais difícil.
    expect(roundPlan(1, 30, 5).opponentBump).toBeGreaterThan(roundPlan(1, 30, 0).opponentBump)
  })

  it('modificador/evento determinísticos; rodada-chefe não tem nenhum', () => {
    expect(roundModifier(7, 2)?.id).toBe(roundModifier(7, 2)?.id)
    expect(isEventRound(7, 2)).toBe(isEventRound(7, 2))
    expect(roundModifier(7, 4)).toBeNull() // chefe
    expect(isEventRound(7, 4)).toBe(false) // chefe
  })
})
