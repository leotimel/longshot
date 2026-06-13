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

    act(() => result.current.confirm([0, 0, 0, 0, 0]))

    expect(result.current.locked).toBe(true)
    expect(result.current.bracket).not.toBeNull()
    expect(result.current.day?.picks).toEqual([0, 0, 0, 0, 0])
  })

  it('ao montar de novo, lê o dia já travado (vai direto ao bracket)', () => {
    const first = renderHook(() => usePlayoff('2026-06-13'))
    act(() => first.result.current.confirm([1, 0, 1, 0, 1]))

    const second = renderHook(() => usePlayoff('2026-06-13'))
    expect(second.result.current.locked).toBe(true)
    expect(second.result.current.day?.picks).toEqual([1, 0, 1, 0, 1])
    expect(second.result.current.bracket).not.toBeNull()
  })
})
