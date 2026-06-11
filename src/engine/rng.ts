/**
 * RNG determinístico do motor.
 *
 * Engine puro (sem DOM, sem Math.random). A partir de uma seed numérica,
 * produz um stream reproduzível — base do sorteio do draft (1.5) e da
 * simulação de jogos (Fase 2).
 */

/**
 * PRNG mulberry32: de uma seed (uint32) gera uma função que retorna floats em
 * [0, 1). Mesma seed → mesma sequência, sempre.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates determinístico: retorna uma cópia de `items` embaralhada usando
 * `rng`. Não muta a entrada; preserva os elementos (permutação).
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}
