import { describe, it, expect } from 'vitest'
import type { DayRecord } from './storage'
import { ROSTERS } from '../engine/data/rosters'
import { overall } from './playerStats'
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
  it('cabeçalho e bolinhas em linhas separadas (sem nomes de times)', () => {
    const n = puzzleNumber('2026-06-10')
    // ids falsos → sem prévia do quinteto: só cabeçalho + linha do bracket
    expect(buildShareText(mk('2026-06-10', 4, false, 2), 9)).toBe(
      `Longshot #${n} · 🥇 · 🔥9\n🟩🟩🟩🟥`,
    )
  })

  it('campeão: 🏆 e 🟩🟩🟩🟩', () => {
    const txt = buildShareText(mk('2026-06-10', 4, true, 3), 5)
    expect(txt).toContain('🏆 · 🔥5')
    expect(txt.split('\n')).toContain('🟩🟩🟩🟩')
  })

  it('eliminado no First Round: 💀 e 🟥⬜⬜⬜', () => {
    const txt = buildShareText(mk('2026-06-10', 1, false, null), 1)
    expect(txt).toContain('💀 · 🔥1')
    expect(txt.split('\n')).toContain('🟥⬜⬜⬜')
  })

  it('não revela nenhum nome de adversário', () => {
    const txt = buildShareText(mk('2026-06-10', 4, false, 2), 9)
    expect(txt).not.toMatch(/Bulls|Lakers|Spurs|Warriors|Celtics/i)
  })

  it('com ids reais, anexa prévia do quinteto (sobrenome + overall) e a média', () => {
    const team = ROSTERS['bulls-1996']
    const day: DayRecord = {
      date: '2026-06-10',
      team: team.map((p) => p.id),
      finalRound: 4,
      champion: true,
      badge: 3,
    }
    const txt = buildShareText(day, 5)
    const lines = txt.split('\n')

    // cabeçalho (linha 0), bolinhas (linha 1), 5 jogadores e a média
    expect(lines[0]).toContain('🏆 · 🔥5')
    expect(lines[1]).toBe('🟩🟩🟩🟩')
    for (const p of team) {
      const last = p.name.trim().split(/\s+/).at(-1)!
      expect(txt).toMatch(new RegExp(`${last}\\s+${overall(p)}`))
    }
    const avg = Math.round(team.reduce((s, p) => s + overall(p), 0) / team.length)
    expect(lines.at(-1)).toBe(`Quinteto ${avg} OVR`)
  })
})
