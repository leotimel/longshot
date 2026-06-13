/**
 * Seed determinística do dia.
 *
 * Engine puro (sem DOM). A partir da data (YYYY-MM-DD) e das 5 escolhas
 * binárias do draft, produz uma seed numérica estável: mesma data + mesmos
 * picks = mesma seed, sempre. Sem Math.random — a comparabilidade social
 * depende disso (mesmos picks → mesmo bracket).
 */

/**
 * Hash de string determinístico (xmur3). Retorna um inteiro de 32 bits sem
 * sinal, com boa dispersão para entradas pequenas como datas e picks.
 * Primitiva reutilizada para derivar seeds (data, picks, rodada).
 */
export function hashString(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

/**
 * Seed numérica a partir da data e dos picks binários do draft.
 *
 * @param date  data no formato YYYY-MM-DD
 * @param picks as 5 escolhas binárias (0s e 1s), na ordem
 * @returns inteiro de 32 bits sem sinal, estável para os mesmos argumentos
 */
export function seedFromDayAndPicks(date: string, picks: number[]): number {
  return hashString(`${date}|${picks.join(',')}`)
}

/**
 * Seed da série de uma rodada do bracket = hash(data + picks + índice da
 * rodada). Mesmos picks → mesmo resultado em cada rodada; rodadas diferentes
 * têm seeds diferentes.
 *
 * @param roundIndex 0=First Round … 3=Finals
 */
export function seedForSeries(date: string, picks: number[], roundIndex: number): number {
  return hashString(`${date}|${picks.join(',')}|${roundIndex}`)
}
