import { describe, it, expect } from 'vitest'
import type { DayRecord } from './storage'
import {
  codenameForLevel,
  emblemForLevel,
  levelForXp,
  roundsWon,
  totalXpFromHistory,
  xpForDay,
  xpToNext,
} from './level'

const mk = (champion: boolean, badge: number | null): DayRecord => ({
  date: '2026-06-14',
  team: ['a', 'b', 'c', 'd', 'e'],
  finalRound: champion ? 4 : badge === null ? 1 : badge + 2,
  champion,
  badge,
})

describe('xpForDay (íngreme no fim)', () => {
  it('mapeia rodadas vencidas → XP', () => {
    expect(roundsWon(mk(false, null))).toBe(0)
    expect(xpForDay(mk(false, null))).toBe(10) // eliminado no 1R
    expect(xpForDay(mk(false, 0))).toBe(20) // venceu 1R
    expect(xpForDay(mk(false, 1))).toBe(35) // venceu 2R
    expect(xpForDay(mk(false, 2))).toBe(55) // perdeu nas Finais
    expect(xpForDay(mk(true, 3))).toBe(85) // campeão
  })
})

describe('curva e nível', () => {
  it('xpToNext cresce até o teto', () => {
    expect(xpToNext(1)).toBe(60)
    expect(xpToNext(2)).toBe(75)
    expect(xpToNext(100)).toBe(150) // teto
  })

  it('levelForXp deriva nível e progresso', () => {
    expect(levelForXp(0)).toMatchObject({ level: 1, xpInLevel: 0, xpForNext: 60 })
    expect(levelForXp(59).level).toBe(1)
    expect(levelForXp(60)).toMatchObject({ level: 2, xpInLevel: 0 })
    expect(levelForXp(60 + 75).level).toBe(3)
  })

  it('patentes (Carreira NBA) por nível', () => {
    expect(codenameForLevel(1)).toBe('Rookie')
    expect(codenameForLevel(5)).toBe('Role Player')
    expect(codenameForLevel(10)).toBe('Starter')
    expect(codenameForLevel(20)).toBe('All-Star')
    expect(emblemForLevel(1)).toBe('🏀')
    expect(emblemForLevel(35)).toBe('👑')
  })
})

describe('totalXpFromHistory', () => {
  it('soma o XP de todos os dias', () => {
    const history = [mk(false, null), mk(false, 1), mk(true, 3)] // 10 + 35 + 85
    expect(totalXpFromHistory(history)).toBe(130)
  })
})
