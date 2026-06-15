/**
 * Bracket completo — as 4 rodadas de playoff em sequência.
 *
 * Engine puro. Carrega os 4 adversários do dia (definidos pela data, em escalada
 * de força) e simula as séries em ordem; se o jogador perde uma série, o bracket
 * para ali. A seed de cada série = hash(data + chave do time + índice da rodada),
 * onde a chave são os ids dos 5 jogadores draftados — mesmo time = mesmo resultado.
 */
import type { BracketResult, BracketTactics, Player, SeriesResult } from './types'
import { dailyDraft } from './draft'
import { seedForSeries } from './seed'
import { simulateSeries } from './series'

/**
 * Simula o bracket inteiro de um dia para um time draftado. `tactics`/`sixthMan`
 * (opcionais) são a "prancheta" do jogador — determinísticos; sem eles = baseline.
 *
 * @param playerTeam o quinteto montado (5 jogadores)
 * @param date       data do dia (YYYY-MM-DD) — define os adversários
 * @param tactics    táticas por rodada (esquema/timeout/takeover/sexto homem)
 * @param sixthMan   reserva draftado (entra por substituição)
 */
export function simulateBracket(
  playerTeam: Player[],
  date: string,
  tactics?: BracketTactics,
  sixthMan?: Player,
): BracketResult {
  const { bracket } = dailyDraft(date)
  const key = playerTeam.map((p) => p.id).join(',')
  const rounds: SeriesResult[] = []

  for (let i = 0; i < bracket.length; i++) {
    const series = simulateSeries(
      playerTeam,
      bracket[i],
      seedForSeries(date, key, i),
      tactics?.[i],
      sixthMan,
    )
    rounds.push(series)
    if (series.winner === 'opponent') break // eliminado: para aqui
  }

  const champion =
    rounds.length === bracket.length && rounds[rounds.length - 1].winner === 'player'

  return { rounds, champion }
}
