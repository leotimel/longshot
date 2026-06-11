/**
 * Draft diário — monta o "dia" do Longshot.
 *
 * Engine puro (sem DOM). A partir SÓ da data, sorteia 2 jogadores por posição
 * (10 opções) e os 4 adversários do bracket — determinístico (mesmo dia = mesmo
 * sorteio para todos). O bracket independe dos picks; é definido pela data.
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
  /** Uma dupla de jogadores por posição, na ordem de POSITIONS. */
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
 * @param date data no formato YYYY-MM-DD
 */
export function dailyDraft(date: string): DailyDraft {
  // Pool: 2 jogadores por posição. Stream próprio (salt `players`).
  const poolRng = mulberry32(hashString(`${date}|players`))
  const playerPool = POSITIONS.map((pos) =>
    shuffle(PLAYERS_BY_POSITION[pos], poolRng).slice(0, 2),
  )

  // Bracket: 4 adversários distintos, definidos só pela data (salt `bracket`),
  // ordenados do mais fraco (First Round) ao mais forte (Finals).
  const bracketRng = mulberry32(hashString(`${date}|bracket`))
  const bracket = shuffle(TEAMS, bracketRng)
    .slice(0, 4)
    .sort((a, b) => teamStrength(a) - teamStrength(b)) as Bracket

  return { date, playerPool, bracket }
}
