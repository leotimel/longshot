import { describe, it, expect } from 'vitest'
import { seedFromDayAndPicks } from './seed'

describe('seedFromDayAndPicks', () => {
  it('é determinística: mesmos args → mesma seed', () => {
    const a = seedFromDayAndPicks('2026-06-11', [0, 1, 1, 0, 1])
    const b = seedFromDayAndPicks('2026-06-11', [0, 1, 1, 0, 1])
    expect(a).toBe(b)
  })

  it('picks diferentes → seeds diferentes', () => {
    const a = seedFromDayAndPicks('2026-06-11', [0, 1, 1, 0, 1])
    const b = seedFromDayAndPicks('2026-06-11', [1, 1, 1, 0, 1])
    expect(a).not.toBe(b)
  })

  it('datas diferentes → seeds diferentes', () => {
    const a = seedFromDayAndPicks('2026-06-11', [0, 1, 1, 0, 1])
    const b = seedFromDayAndPicks('2026-06-12', [0, 1, 1, 0, 1])
    expect(a).not.toBe(b)
  })

  it('a ordem dos picks importa', () => {
    const a = seedFromDayAndPicks('2026-06-11', [0, 1, 1, 0, 1])
    const b = seedFromDayAndPicks('2026-06-11', [1, 0, 1, 1, 0])
    expect(a).not.toBe(b)
  })

  it('retorna um inteiro de 32 bits sem sinal', () => {
    const s = seedFromDayAndPicks('2026-06-11', [0, 0, 0, 0, 0])
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(0xffffffff)
  })
})
