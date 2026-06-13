/**
 * Draft diário — monta o "dia" do Longshot.
 *
 * Engine puro (sem DOM). Sorteia 3 jogadores por posição (15 opções) e os 4
 * adversários do bracket. Os **adversários são definidos só pela data** (iguais
 * para todos no dia, independentes dos picks). O **pool** usa um `poolSalt`
 * opcional: vazio = igual para todos; um salt por jogador = sorteio pessoal.
 */
import { POSITIONS, type HistoricalTeam, type Player } from './types'
import { PLAYERS_BY_POSITION } from './data/players'
import { TEAMS } from './data/teams'
import { hashString } from './seed'
import { mulberry32, shuffle } from './rng'

/** As 4 séries do bracket, do First Round às Finals. */
export type Bracket = [HistoricalTeam, HistoricalTeam, HistoricalTeam, HistoricalTeam]

export interface DailyDraft {
  date: string
  /** Três jogadores por posição (opções do draft), na ordem de POSITIONS. */
  playerPool: Player[][]
  /** Adversários por rodada (First Round → Finals), em escalada de força. */
  bracket: Bracket
}

/** Força agregada de um time histórico (para a escalada do bracket). */
function teamStrength(team: HistoricalTeam): number {
  const { offense, defense, clutch } = team.teamRatings
  return offense + defense + clutch
}

/**
 * Sorteio determinístico do dia.
 *
 * @param date     data no formato YYYY-MM-DD
 * @param poolSalt sal opcional do pool: vazio = igual para todos; por jogador =
 *                 sorteio pessoal. NÃO afeta os adversários (sempre pela data).
 */
export function dailyDraft(date: string, poolSalt = ''): DailyDraft {
  // Pool: 3 jogadores por posição. Stream próprio (salt do jogador + data).
  const poolRng = mulberry32(hashString(`${poolSalt}|${date}|players`))
  const playerPool = POSITIONS.map((pos) =>
    shuffle(PLAYERS_BY_POSITION[pos], poolRng).slice(0, 3),
  )

  // Bracket: 4 adversários distintos, definidos só pela data (salt `bracket`),
  // ordenados do mais fraco (First Round) ao mais forte (Finals).
  const bracketRng = mulberry32(hashString(`${date}|bracket`))
  const bracket = shuffle(TEAMS, bracketRng)
    .slice(0, 4)
    .sort((a, b) => teamStrength(a) - teamStrength(b)) as Bracket

  return { date, playerPool, bracket }
}
