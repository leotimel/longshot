// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayoff } from './usePlayoff'

beforeEach(() => localStorage.clear())

describe('usePlayoff', () => {
  it('trava o draft ao confirmar e expõe o bracket', () => {
    const { result } = renderHook(() => usePlayoff('2026-06-13'))
    expect(result.current.locked).toBe(false)
    expect(result.current.bracket).toBeNull()

    act(() => result.current.confirm([0, 2, 1, 0, 2]))

    expect(result.current.locked).toBe(true)
    expect(result.current.bracket).not.toBeNull()
    expect(result.current.day?.picks).toEqual([0, 2, 1, 0, 2])
    expect(result.current.justConfirmed).toBe(true)
    expect(typeof result.current.day?.poolSalt).toBe('string')
  })

  it('ao montar de novo, lê o dia já travado (sem justConfirmed → sem revelação gradual)', () => {
    const first = renderHook(() => usePlayoff('2026-06-13'))
    act(() => first.result.current.confirm([1, 0, 1, 0, 1]))

    const second = renderHook(() => usePlayoff('2026-06-13'))
    expect(second.result.current.locked).toBe(true)
    expect(second.result.current.day?.picks).toEqual([1, 0, 1, 0, 1])
    expect(second.result.current.bracket).not.toBeNull()
    expect(second.result.current.justConfirmed).toBe(false)
  })
})
