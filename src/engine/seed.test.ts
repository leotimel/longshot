import { describe, it, expect } from 'vitest'
import { hashString, seedForSeries } from './seed'

describe('hashString', () => {
  it('é determinística e retorna uint32', () => {
    const a = hashString('longshot')
    expect(a).toBe(hashString('longshot'))
    expect(Number.isInteger(a)).toBe(true)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThanOrEqual(0xffffffff)
  })

  it('entradas diferentes → hashes diferentes', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
  })
})

describe('seedForSeries', () => {
  it('mesmos args → mesma seed', () => {
    expect(seedForSeries('2026-06-13', 'curry,jordan', 0)).toBe(
      seedForSeries('2026-06-13', 'curry,jordan', 0),
    )
  })

  it('time, data ou rodada diferentes → seeds diferentes', () => {
    const base = seedForSeries('2026-06-13', 'curry,jordan', 0)
    expect(seedForSeries('2026-06-13', 'curry,kobe', 0)).not.toBe(base)
    expect(seedForSeries('2026-06-14', 'curry,jordan', 0)).not.toBe(base)
    expect(seedForSeries('2026-06-13', 'curry,jordan', 1)).not.toBe(base)
  })
})
