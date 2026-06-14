// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { dailyDraft } from '../engine/draft'
import { usePlayoff } from './usePlayoff'

beforeEach(() => localStorage.clear())

// Um time válido = o starting 5 de um time draftável (todos em ROSTERS).
const teamFor = (date: string) => dailyDraft(date, '').draftTeams[0].roster

describe('usePlayoff', () => {
  it('trava o time ao confirmar e expõe o bracket', () => {
    const { result } = renderHook(() => usePlayoff('2026-06-13'))
    expect(result.current.locked).toBe(false)
    expect(result.current.bracket).toBeNull()

    act(() => result.current.confirm(teamFor('2026-06-13')))

    expect(result.current.locked).toBe(true)
    expect(result.current.bracket).not.toBeNull()
    expect(result.current.day?.team).toHaveLength(5)
    expect(result.current.justConfirmed).toBe(true)
  })

  it('ao montar de novo, lê o dia travado e recompõe o bracket pelos ids', () => {
    const team = teamFor('2026-06-13')
    const first = renderHook(() => usePlayoff('2026-06-13'))
    act(() => first.result.current.confirm(team))

    const second = renderHook(() => usePlayoff('2026-06-13'))
    expect(second.result.current.locked).toBe(true)
    expect(second.result.current.day?.team).toEqual(team.map((p) => p.id))
    expect(second.result.current.bracket).not.toBeNull()
    expect(second.result.current.justConfirmed).toBe(false)
  })
})
