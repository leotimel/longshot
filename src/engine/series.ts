/**
 * Série melhor de 7 — joga jogo a jogo até alguém vencer 4.
 *
 * Engine puro. Determinística pela baseSeed: cada jogo deriva a própria seed
 * (baseSeed + número do jogo), variando os placares sem alterar o resultado da
 * série. Empates (placar igual, que o sim pode produzir) são re-sorteados com
 * uma seed de prorrogação até serem decididos — sem mexer no sim.
 */
import type {
  GameAdjust,
  GameResult,
  HistoricalTeam,
  Player,
  SeriesResult,
  SeriesTactics,
} from './types'
import { hashString } from './seed'
import { simulateGame } from './sim'
import { adjustForGame, mergeAdjust } from './tactics'

const WINS_NEEDED = 4

/** Joga um jogo decisivo: re-sorteia (prorrogação) enquanto houver empate. */
function decisiveGame(
  playerTeam: Player[],
  opponent: HistoricalTeam,
  seed: number,
  adjust?: GameAdjust,
): GameResult {
  let game = simulateGame(playerTeam, opponent, seed, adjust)
  let otSeed = seed
  let guard = 0
  while (game.homeScore === game.awayScore && guard < 64) {
    otSeed = hashString(`${otSeed}:ot`)
    game = simulateGame(playerTeam, opponent, otSeed, adjust)
    guard++
  }
  return game
}

/**
 * Simula uma série melhor de 7. `tactics`/`sixthMan` (opcionais) aplicam ajustes
 * por jogo de forma determinística — sem eles, idêntico ao baseline.
 *
 * @param baseSeed seed da série → mesma baseSeed (+ mesmas táticas) = mesma série
 * @returns todos os jogos, o vencedor e o placar da série (ótica do jogador)
 */
export function simulateSeries(
  playerTeam: Player[],
  opponent: HistoricalTeam,
  baseSeed: number,
  tactics?: SeriesTactics,
  sixthMan?: Player,
  baseAdjust?: GameAdjust,
): SeriesResult {
  const games: GameResult[] = []
  let playerWins = 0
  let opponentWins = 0

  for (let g = 1; playerWins < WINS_NEEDED && opponentWins < WINS_NEEDED; g++) {
    const adjust = mergeAdjust(baseAdjust, adjustForGame(tactics, g, playerTeam, sixthMan))
    const game = decisiveGame(playerTeam, opponent, hashString(`${baseSeed}:${g}`), adjust)
    games.push(game)
    if (game.homeScore > game.awayScore) playerWins++
    else opponentWins++
  }

  return {
    winner: playerWins >= WINS_NEEDED ? 'player' : 'opponent',
    games,
    gamesWon: playerWins,
    gamesLost: opponentWins,
  }
}
