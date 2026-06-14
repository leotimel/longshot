/**
 * Seeds determinísticas do motor.
 *
 * Engine puro (sem DOM, sem Math.random). A partir de strings (data, chave do
 * time, índice da rodada) produz seeds numéricas estáveis.
 */

/**
 * Hash de string determinístico (xmur3). Retorna um inteiro de 32 bits sem
 * sinal, com boa dispersão para entradas pequenas. Primitiva reutilizada para
 * derivar seeds (data, time, rodada) e os streams de sorteio do draft.
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
 * Seed da série de uma rodada = hash(data + chave do time + índice da rodada).
 * A `key` identifica o time draftado (ex.: ids dos jogadores), garantindo que
 * o mesmo time = mesmo resultado em cada rodada; rodadas diferentes têm seeds
 * diferentes.
 *
 * @param roundIndex 0=First Round … 3=Finals
 */
export function seedForSeries(date: string, key: string, roundIndex: number): number {
  return hashString(`${date}|${key}|${roundIndex}`)
}
