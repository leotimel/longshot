/**
 * Link de desafio — sem servidor: o dia + o selo vão no hash da URL.
 * Quem abre vê "Supere: 🥇 Conference Finals" antes de jogar (no mesmo dia).
 */
import { BADGE_EMOJI, BADGE_NAMES } from './badges'

export interface Challenge {
  date: string
  badge: number | null
}

function toBase64Url(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
}

export function encodeChallenge(c: Challenge): string {
  return toBase64Url(JSON.stringify({ d: c.date, b: c.badge }))
}

export function decodeChallenge(hash: string): Challenge | null {
  try {
    const m = /c=([^&]+)/.exec(hash)
    if (!m) return null
    const o = JSON.parse(fromBase64Url(m[1])) as { d?: unknown; b?: unknown }
    if (typeof o.d !== 'string') return null
    return { date: o.d, badge: typeof o.b === 'number' ? o.b : null }
  } catch {
    return null
  }
}

/** URL completa do desafio (origin + pathname + #c=...). */
export function challengeUrl(c: Challenge): string {
  const base = typeof location !== 'undefined' ? location.origin + location.pathname : ''
  return `${base}#c=${encodeChallenge(c)}`
}

/** Lê o desafio do hash atual da URL, se houver. */
export function readChallenge(): Challenge | null {
  if (typeof location === 'undefined') return null
  return decodeChallenge(location.hash)
}

/** Rótulo do alvo a superar, ex.: "🥇 Conference Finals". */
export function challengeTarget(badge: number | null): string {
  return badge !== null ? `${BADGE_EMOJI[badge]} ${BADGE_NAMES[badge]}` : 'passar do First Round'
}
