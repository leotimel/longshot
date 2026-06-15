import { describe, it, expect } from 'vitest'
import type { BracketTactics } from '../engine/types'
import { COACH_TOKENS, takeoverUsed, tokensLeft, tokensSpent } from './tactics'

describe('orçamento de fichas', () => {
  it('conta fichas gastas pelo schedule', () => {
    const t: BracketTactics = {
      0: { scheme: 'travar', timeoutFromGame: 3 }, // 2 fichas
      1: { takeoverGame: 2 }, // 1 ficha
    }
    expect(tokensSpent(t)).toBe(3)
    expect(tokensLeft(t)).toBe(COACH_TOKENS - 3)
  })

  it('sem táticas, orçamento cheio', () => {
    expect(tokensSpent({})).toBe(0)
    expect(tokensLeft({})).toBe(COACH_TOKENS)
  })

  it('detecta takeover usado (máx 1)', () => {
    expect(takeoverUsed({})).toBe(false)
    expect(takeoverUsed({ 2: { takeoverGame: 1 } })).toBe(true)
  })
})
