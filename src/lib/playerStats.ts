import type { Player } from '../engine/types'

/**
 * "Overall" de exibição de um jogador: média dos 7 ratings, arredondada.
 * É cálculo puro de UI (não vive no engine). Usado no draft e no bracket.
 */
export function overall(p: Player): number {
  const r = p.ratings
  return Math.round(
    (r.speed + r.shooting + r.threePoint + r.defense + r.passing + r.rebounding + r.clutch) / 7,
  )
}
