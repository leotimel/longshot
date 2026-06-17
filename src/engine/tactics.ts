/**
 * Resolução determinística das táticas → `GameAdjust` por jogo. Engine puro: os
 * deltas fazem parte da simulação (mesmas táticas = mesmo resultado). Custos e
 * rótulos de UI ficam em `lib/tactics.ts`.
 */
import type { GameAdjust, Player, SchemeId, SeriesTactics } from './types'

/** Esquemas de série — cada boost tem um custo (trade-off). */
export const SCHEME_ADJUST: Record<SchemeId, GameAdjust> = {
  acelerar: { pace: 14, defense: -6 },
  travar: { defense: 9, pace: -12 },
  isolar: { focusBoost: 1.7, make: -0.015 },
  garrafao: { make: 0.025, threeBias: -0.16, defense: 3 },
}

/** Timeout (comeback) — vale do jogo gatilho em diante. */
const TIMEOUT_ADJUST: GameAdjust = { clutch: 8, make: 0.03, defense: 4 }
/** Takeover do craque — só no jogo escolhido. */
const TAKEOVER_ADJUST: GameAdjust = { focusBoost: 2.3, make: 0.05, clutch: 6 }

/** "Craque" do quinteto: melhor proxy de pontuação (puro, sem depender da UI). */
function starId(team: Player[]): string {
  let best = team[0]
  let bestScore = -1
  for (const p of team) {
    const s = p.ratings.shooting + 0.4 * p.ratings.threePoint + p.ratings.clutch
    if (s > bestScore) {
      bestScore = s
      best = p
    }
  }
  return best.id
}

/** Quinteto com o sexto homem no lugar do titular da mesma posição. */
function withSixthMan(team: Player[], sixthMan: Player): Player[] {
  return team.map((p) => (p.position === sixthMan.position ? sixthMan : p))
}

/** Soma dois ajustes (deltas somam; foco/lineup do segundo prevalecem). */
export function mergeAdjust(a?: GameAdjust, b?: GameAdjust): GameAdjust | undefined {
  if (!a) return b
  if (!b) return a
  return {
    defense: (a.defense ?? 0) + (b.defense ?? 0) || undefined,
    pace: (a.pace ?? 0) + (b.pace ?? 0) || undefined,
    clutch: (a.clutch ?? 0) + (b.clutch ?? 0) || undefined,
    make: (a.make ?? 0) + (b.make ?? 0) || undefined,
    threeBias: (a.threeBias ?? 0) + (b.threeBias ?? 0) || undefined,
    focusId: b.focusId ?? a.focusId,
    focusBoost: b.focusBoost ?? a.focusBoost,
    lineup: b.lineup ?? a.lineup,
  }
}

/**
 * Constrói o ajuste de um jogo (1-based) a partir das táticas da série. Retorna
 * `undefined` quando nada se aplica → jogo idêntico ao baseline.
 */
export function adjustForGame(
  tactics: SeriesTactics | undefined,
  game: number,
  team: Player[],
  sixthMan?: Player,
): GameAdjust | undefined {
  if (!tactics) return undefined

  const useSixth =
    !!sixthMan && tactics.sixthManFromGame !== undefined && game >= tactics.sixthManFromGame
  const lineup = useSixth ? withSixthMan(team, sixthMan!) : undefined
  const effTeam = lineup ?? team

  let defense = 0
  let pace = 0
  let clutch = 0
  let make = 0
  let threeBias = 0
  let focusId: string | undefined
  let focusBoost = 1

  const add = (a: GameAdjust): void => {
    defense += a.defense ?? 0
    pace += a.pace ?? 0
    clutch += a.clutch ?? 0
    make += a.make ?? 0
    threeBias += a.threeBias ?? 0
    if (a.focusBoost !== undefined) {
      focusId = starId(effTeam)
      focusBoost = Math.max(focusBoost, a.focusBoost)
    }
  }

  if (tactics.scheme) add(SCHEME_ADJUST[tactics.scheme])
  if (tactics.timeoutFromGame !== undefined && game >= tactics.timeoutFromGame) add(TIMEOUT_ADJUST)
  if (tactics.takeoverGame === game) add(TAKEOVER_ADJUST)

  if (!lineup && !defense && !pace && !clutch && !make && !threeBias && !focusId) {
    return undefined
  }
  return {
    defense,
    pace,
    clutch,
    make,
    threeBias,
    focusId,
    focusBoost: focusId ? focusBoost : undefined,
    lineup,
  }
}
