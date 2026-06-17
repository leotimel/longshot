/**
 * Sinergia de era — química do quinteto. Como o draft pega 1 jogador por time
 * DISTINTO, "mesmo time" não ocorre; a coesão é por ERA. Um quinteto com 3+
 * jogadores da mesma era ganha um bônus determinístico (clutch + acerto) na
 * simulação. Engine puro.
 */
import type { Era, GameAdjust, Player } from './types'

export interface Synergy {
  /** Era dominante (a com mais jogadores), ou null se time vazio. */
  era: Era | null
  /** Quantos jogadores compartilham a era dominante. */
  count: number
}

/** Era dominante do quinteto e quantos a compartilham. */
export function synergyOf(team: Player[]): Synergy {
  const counts = new Map<Era, number>()
  for (const p of team) counts.set(p.era, (counts.get(p.era) ?? 0) + 1)
  let era: Era | null = null
  let count = 0
  for (const [e, n] of counts) {
    if (n > count) {
      count = n
      era = e
    }
  }
  return { era, count }
}

/** Coesão suficiente (3+ da mesma era) → bônus de química; senão `undefined`. */
export function synergyAdjust(team: Player[]): GameAdjust | undefined {
  const { count } = synergyOf(team)
  if (count < 3) return undefined
  return { clutch: (count - 2) * 3, make: (count - 2) * 0.006 } // 3→leve · 5→forte
}
