/**
 * Série melhor de 7 — joga jogo a jogo até alguém vencer 4.
 *
 * Engine puro. Determinística pela baseSeed: cada jogo deriva a própria seed
 * (baseSeed + número do jogo), variando os placares sem alterar o resultado da
 * série. Empates (placar igual, que o sim pode produzir) são re-sorteados com
 * uma seed de prorrogação até serem decididos — sem mexer no sim.
 */
import type { GameResult, HistoricalTeam, Player, SeriesResult } from './types'
import { hashString } from './seed'
import { simulateGame } from './sim'

const WINS_NEEDED = 4

/** Joga um jogo decisivo: re-sorteia (prorrogação) enquanto houver empate. */
function decisiveGame(
  playerTeam: Player[],
  opponent: HistoricalTeam,
  seed: number,
): GameResult {
  let game = simulateGame(playerTeam, opponent, seed)
  let otSeed = seed
  let guard = 0
  while (game.homeScore === game.awayScore && guard < 64) {
    otSeed = hashString(`${otSeed}:ot`)
    game = simulateGame(playerTeam, opponent, otSeed)
    guard++
  }
  return game
}

/**
 * Simula uma série melhor de 7.
 *
 * @param baseSeed seed da série → mesma baseSeed = mesma série
 * @returns todos os jogos, o vencedor e o placar da série (ótica do jogador)
 */
export function simulateSeries(
  playerTeam: Player[],
  opponent: HistoricalTeam,
  baseSeed: number,
): SeriesResult {
  const games: GameResult[] = []
  let playerWins = 0
  let opponentWins = 0

  for (let g = 1; playerWins < WINS_NEEDED && opponentWins < WINS_NEEDED; g++) {
    const game = decisiveGame(playerTeam, opponent, hashString(`${baseSeed}:${g}`))
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
