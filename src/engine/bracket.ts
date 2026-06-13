/**
 * Bracket completo — as 4 rodadas de playoff em sequência.
 *
 * Engine puro. Carrega os 4 adversários do dia (já definidos por dailyDraft,
 * em escalada de força) e simula as séries em ordem; se o jogador perde uma
 * série, o bracket para ali. A seed de cada série = hash(data + picks + índice
 * da rodada), então mesmo time draftado = mesmo resultado em cada rodada.
 */
import type { BracketResult, Player, SeriesResult } from './types'
import { dailyDraft } from './draft'
import { seedForSeries } from './seed'
import { simulateSeries } from './series'

/**
 * Simula o bracket inteiro de um dia para um time draftado.
 *
 * @param playerTeam o quinteto montado
 * @param date       data do dia (YYYY-MM-DD) — define os adversários
 * @param picks      as 5 escolhas binárias do draft — entram na seed das séries
 */
export function simulateBracket(
  playerTeam: Player[],
  date: string,
  picks: number[],
): BracketResult {
  const { bracket } = dailyDraft(date)
  const rounds: SeriesResult[] = []

  for (let i = 0; i < bracket.length; i++) {
    const series = simulateSeries(playerTeam, bracket[i], seedForSeries(date, picks, i))
    rounds.push(series)
    if (series.winner === 'opponent') break // eliminado: para aqui
  }

  const champion =
    rounds.length === bracket.length && rounds[rounds.length - 1].winner === 'player'

  return { rounds, champion }
}
