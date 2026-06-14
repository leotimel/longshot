import { describe, it, expect } from 'vitest'
import type { DayRecord } from './storage'
import { buildShareText, LONGSHOT_EPOCH, puzzleNumber } from './share'

const mk = (date: string, finalRound: number, champion: boolean, badge: number | null): DayRecord => ({
  date,
  team: ['a', 'b', 'c', 'd', 'e'],
  finalRound,
  champion,
  badge,
})

describe('puzzleNumber', () => {
  it('conta a partir do epoch', () => {
    expect(puzzleNumber(LONGSHOT_EPOCH)).toBe(1)
    expect(puzzleNumber('2026-06-02')).toBe(2)
    expect(puzzleNumber('2026-07-01')).toBe(31)
  })
})

describe('buildShareText', () => {
  it('perdeu na final: 🥇 e 🟩🟩🟩🟥 (sem nomes de times)', () => {
    const n = puzzleNumber('2026-06-10')
    expect(buildShareText(mk('2026-06-10', 4, false, 2), 9)).toBe(
      `Longshot #${n} · 🥇 · 🔥9 | 🟩🟩🟩🟥`,
    )
  })

  it('campeão: 🏆 e 🟩🟩🟩🟩', () => {
    expect(buildShareText(mk('2026-06-10', 4, true, 3), 5)).toContain('🏆 · 🔥5 | 🟩🟩🟩🟩')
  })

  it('eliminado no First Round: 💀 e 🟥⬜⬜⬜', () => {
    expect(buildShareText(mk('2026-06-10', 1, false, null), 1)).toContain('💀 · 🔥1 | 🟥⬜⬜⬜')
  })

  it('não revela nenhum nome de adversário', () => {
    const txt = buildShareText(mk('2026-06-10', 4, false, 2), 9)
    expect(txt).not.toMatch(/Bulls|Lakers|Spurs|Warriors|Celtics/i)
  })
})
