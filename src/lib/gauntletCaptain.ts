/**
 * Capitão do Gauntlet — meta-progressão.
 *
 * Desbloqueado por mérito (recorde ≥ CAPTAIN_UNLOCK em intensidade Padrão+). O jogador
 * escolhe UM jogador (escolha única) que entra fixo no quinteto de toda run. Ao bater
 * desafios escalonados, o capitão ganha BOOSTS PERMANENTES (derivados do progresso
 * acumulado em `CaptainState`). Puro; valores TUNÁVEIS abaixo.
 */
import type { GameAdjust, Player } from '../engine/types'
import { playerById } from '../engine/data/rosters'
import type { CaptainState } from './storage'

/** Recorde (em intensidade ≥ Padrão) que desbloqueia a escolha do capitão. */
export const CAPTAIN_UNLOCK = 50

export interface CaptainChallenge {
  id: string
  emoji: string
  name: string
  desc: string
  cur: (c: CaptainState) => number
  goal: number
}

/** Desafios do capitão (cada um libera um boost permanente ao ser cumprido). */
export const CAPTAIN_CHALLENGES: CaptainChallenge[] = [
  { id: 'veterano', emoji: '🎖️', name: 'Veterano', desc: 'vença 10 rodadas com o capitão (+2 ratings)', cur: (c) => c.roundsWith, goal: 10 },
  { id: 'matador', emoji: '🪨', name: 'Matador de gigantes', desc: 'vença 3 rodadas-chefe (começa com +1 escudo)', cur: (c) => c.bossWins, goal: 3 },
  { id: 'astro', emoji: '🌟', name: 'Astro', desc: '50+ pontos do capitão num jogo (+acerto)', cur: (c) => c.bestGame, goal: 50 },
  { id: 'lenda', emoji: '👑', name: 'Lenda', desc: 'alcance a rodada 20 com o capitão (+3 ratings)', cur: (c) => c.bestRound, goal: 20 },
]

export const isChallengeDone = (ch: CaptainChallenge, c: CaptainState): boolean => ch.cur(c) >= ch.goal

/** Perks ativos do capitão, derivados dos desafios já cumpridos. */
export interface CaptainPerks {
  /** O capitão com os boosts de rating aplicados (ou undefined se o id sumiu). */
  player: Player | undefined
  /** Escudos de largada (Matador de gigantes). */
  startShields: number
  /** Ajuste de acerto da run quando o capitão joga (Astro). */
  boost: GameAdjust
}

function bumpPlayer(p: Player, n: number): Player {
  if (n <= 0) return p
  const cap = (x: number): number => Math.min(99, x + n)
  const r = p.ratings
  return {
    ...p,
    ratings: {
      speed: cap(r.speed),
      shooting: cap(r.shooting),
      threePoint: cap(r.threePoint),
      defense: cap(r.defense),
      passing: cap(r.passing),
      rebounding: cap(r.rebounding),
      clutch: cap(r.clutch),
    },
  }
}

export function captainPerks(c: CaptainState): CaptainPerks {
  const base = playerById(c.id)
  let ratingBump = 0
  if (c.roundsWith >= 10) ratingBump += 2 // Veterano
  if (c.bestRound >= 20) ratingBump += 3 // Lenda
  return {
    player: base ? bumpPlayer(base, ratingBump) : undefined,
    startShields: c.bossWins >= 3 ? 1 : 0, // Matador de gigantes
    boost: c.bestGame >= 50 ? { make: 0.01 } : {}, // Astro
  }
}
