/**
 * Draft diário — monta o "dia" do Longshot.
 *
 * Engine puro (sem DOM). Sorteia uma **sequência de times históricos** (com
 * elenco) para o jogador draftar — 1 jogador por time, posições únicas — e os 4
 * adversários do bracket. Os **adversários são definidos só pela data** (iguais
 * para todos). A sequência do draft usa um `poolSalt` opcional: vazio = igual
 * para todos; por jogador = sorteio pessoal de times.
 */
import type { HistoricalTeam, Player } from './types'
import { TEAMS } from './data/teams'
import { ROSTERS } from './data/rosters'
import { hashString } from './seed'
import { mulberry32, shuffle } from './rng'

/** As 4 séries do bracket, do First Round às Finals. */
export type Bracket = [HistoricalTeam, HistoricalTeam, HistoricalTeam, HistoricalTeam]

/** Um time draftável: identidade + starting 5. */
export interface DraftTeam {
  id: string
  name: string
  season: string
  roster: Player[]
}

export interface DailyDraft {
  date: string
  /** Sequência sorteada de times para draftar (1 jogador por escolha). */
  draftTeams: DraftTeam[]
  /** Adversários por rodada (First Round → Finals), em escalada de força. */
  bracket: Bracket
}

/** Força agregada de um time histórico (para a escalada do bracket). */
function teamStrength(team: HistoricalTeam): number {
  const { offense, defense, clutch } = team.teamRatings
  return offense + defense + clutch
}

/** Times draftáveis = os que têm elenco em ROSTERS. */
const DRAFTABLE: DraftTeam[] = TEAMS.filter((t) => ROSTERS[t.id]).map((t) => ({
  id: t.id,
  name: t.name,
  season: t.season,
  roster: ROSTERS[t.id],
}))

/**
 * Sorteio determinístico do dia.
 *
 * @param date     data no formato YYYY-MM-DD
 * @param poolSalt sal opcional da sequência do draft: vazio = igual para todos;
 *                 por jogador = sorteio pessoal. NÃO afeta os adversários.
 */
export function dailyDraft(date: string, poolSalt = ''): DailyDraft {
  // Sequência de times do draft: por jogador (salt) + data.
  const draftRng = mulberry32(hashString(`${poolSalt}|${date}|draft`))
  const draftTeams = shuffle(DRAFTABLE, draftRng)

  // Adversários: distintos, definidos só pela data, em escalada de força.
  const bracketRng = mulberry32(hashString(`${date}|bracket`))
  const bracket = shuffle(TEAMS, bracketRng)
    .slice(0, 4)
    .sort((a, b) => teamStrength(a) - teamStrength(b)) as Bracket

  return { date, draftTeams, bracket }
}
