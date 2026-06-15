/**
 * Catálogo de UI da "prancheta do técnico": orçamento de fichas e custos. Os
 * DELTAS de cada tática vivem no engine (`engine/tactics.ts`, determinísticos);
 * os RÓTULOS ficam em `lib/strings.ts`. Aqui mora a contabilidade do orçamento.
 */
import type { BracketTactics, SchemeId } from '../engine/types'

/** Fichas de técnico no playoff inteiro (escassez → escolhas difíceis). */
export const COACH_TOKENS = 3

/** Custo (em fichas) de cada ação. */
export const COST = { scheme: 1, timeout: 1, takeover: 1, sixthMan: 1 } as const

/** Ordem dos esquemas na UI (rótulos vêm de S.tactics.schemes). */
export const SCHEME_IDS: SchemeId[] = ['acelerar', 'travar', 'isolar', 'garrafao']

/** Fichas já gastas, derivadas do schedule de táticas (idempotente em revisita). */
export function tokensSpent(tactics: BracketTactics): number {
  let n = 0
  for (const t of Object.values(tactics)) {
    if (t.scheme) n += COST.scheme
    if (t.timeoutFromGame !== undefined) n += COST.timeout
    if (t.takeoverGame !== undefined) n += COST.takeover
    if (t.sixthManFromGame !== undefined) n += COST.sixthMan
  }
  return n
}

/** Fichas restantes. */
export function tokensLeft(tactics: BracketTactics): number {
  return Math.max(0, COACH_TOKENS - tokensSpent(tactics))
}

/** O takeover já foi usado neste playoff? (máx. 1) */
export function takeoverUsed(tactics: BracketTactics): boolean {
  return Object.values(tactics).some((t) => t.takeoverGame !== undefined)
}
