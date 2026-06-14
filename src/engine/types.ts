/**
 * Tipos do motor (engine) do Longshot.
 *
 * TS puro, sem DOM — é a fonte da verdade dos contratos do motor.
 * Convenção: todos os "ratings" são inteiros na escala 0–100.
 */

/** Inteiro 0–100. (TS não força o intervalo; é convenção do motor.) */
export type Rating = number

/** Posições da quadra (lista canônica; a união é derivada dela). */
export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const
export type Position = (typeof POSITIONS)[number]

/** Décadas de auge (lista canônica; a união é derivada dela). */
export const ERAS = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'] as const
export type Era = (typeof ERAS)[number]

/** Atributos de um jogador (cada um 0–100), refletindo o auge da carreira. */
export interface PlayerRatings {
  speed: Rating
  shooting: Rating
  threePoint: Rating
  defense: Rating
  passing: Rating
  rebounding: Rating
  clutch: Rating
}

/** Um jogador real do pool. Sem fotos/logos — só dados. */
export interface Player {
  id: string
  name: string
  position: Position
  era: Era
  ratings: PlayerRatings
}

/** Atributos de um time histórico (cada um 0–100). */
export interface TeamRatings {
  offense: Rating
  defense: Rating
  pace: Rating
  threePointRate: Rating
  clutch: Rating
}

/** Um time histórico adversário do bracket. */
export interface HistoricalTeam {
  id: string
  name: string
  season: string
  teamRatings: TeamRatings
  description: string
}

/** Pontos de um jogador num jogo (box score de só pontos). */
export interface BoxScoreEntry {
  playerId: string
  name: string
  points: number
}

/**
 * Resultado de um único jogo. `boxScore` lista os pontos por jogador do time
 * draftado; sua soma é igual ao placar do time do jogador.
 */
export interface GameResult {
  homeScore: number
  awayScore: number
  playByPlay: string[]
  boxScore: BoxScoreEntry[]
}

/** Quem venceu uma série — sempre na ótica do jogador. */
export type SeriesWinner = 'player' | 'opponent'

/** Resultado de uma série melhor de 7 (4–7 jogos; o vencedor tem 4 vitórias). */
export interface SeriesResult {
  winner: SeriesWinner
  games: GameResult[]
  gamesWon: number
  gamesLost: number
}

/**
 * Resultado do bracket inteiro (até 4 rodadas). `rounds` tem 1–4 séries: para
 * antes se o jogador perder; `champion` = venceu as 4.
 */
export interface BracketResult {
  rounds: SeriesResult[]
  champion: boolean
}
