import { describe, it, expect } from 'vitest'
import { challengeTarget, challengeUrl, decodeChallenge, encodeChallenge } from './challenge'

describe('challenge', () => {
  it('encode → decode (round-trip pela URL)', () => {
    const c = { date: '2026-06-13', badge: 2 }
    const url = challengeUrl(c)
    expect(url).toContain('#c=')
    expect(decodeChallenge(url)).toEqual(c)
  })

  it('badge null sobrevive', () => {
    const c = { date: '2026-06-13', badge: null }
    expect(decodeChallenge(challengeUrl(c))).toEqual(c)
  })

  it('encode é estável e decode é tolerante a lixo', () => {
    expect(encodeChallenge({ date: '2026-06-13', badge: 2 })).toBe(
      encodeChallenge({ date: '2026-06-13', badge: 2 }),
    )
    expect(decodeChallenge('#x=abc')).toBeNull()
    expect(decodeChallenge('#c=@@@')).toBeNull()
  })

  it('challengeTarget rotula o selo', () => {
    expect(challengeTarget(2)).toBe('🥇 Conference Finals')
    expect(challengeTarget(3)).toBe('🏆 Champion')
    expect(challengeTarget(null)).toBe('passar do First Round')
  })
})
