/**
 * Dinâmicas do Gauntlet — ascensão, rodadas-chefe, modificadores e eventos.
 *
 * Tudo determinístico (pela sessão+rodada) e puro. A dificuldade "fura o teto" via
 * `opponentBump` (reforço nas ratings do adversário, que NÃO são clampadas no motor),
 * controlado por:
 *  - ASCENSÃO: nível fixo da run derivado do RECORDE (a cada 10 rodadas, +1) → bater o
 *    recorde deixa as próximas runs permanentemente mais difíceis.
 *  - CHEFE: a cada 5 rodadas, um adversário reforçado em série melhor de 5.
 *  - MODIFICADORES: twist por rodada (uns ajudam, uns atrapalham).
 *  - EVENTOS: de vez em quando, em vez de boon — descanso (cura) ou aposta (risco/recompensa).
 * Valores TUNÁVEIS abaixo.
 */
import type { GameAdjust } from '../engine/types'
import { mulberry32 } from '../engine/rng'
import { hashString } from '../engine/seed'

export const BOSS_EVERY = 5
const BOSS_BUMP = 8
const BOSS_WINS = 3 // chefe = melhor de 5
const ASCENSION_PER = 10 // a cada 10 de recorde, +1 nível de ascensão
const ASCENSION_BUMP = 3 // reforço no adversário por nível de ascensão (no auge da rampa)
const ASCENSION_RAMP = 15 // rodadas até a ascensão pesar 100% (rodada 1 = 0)
const BET_BUMP = 10 // aposta: reforço extra na rodada apostada
const EVENT_CHANCE = 0.22

/** Nomes dos níveis de intensidade (0..3). */
export const INTENSITY_NAMES = ['Tranquilo', 'Padrão', 'Difícil', 'Lendário'] as const

/** Configuração escolhida pelo jogador para a run (intensidade + mutadores). */
export interface RunConfig {
  /** 0 Tranquilo · 1 Padrão · 2 Difícil · 3 Lendário (soma à ascensão). */
  intensity: number
  /** Hardcore: sem escudos (Fôlego some; recompensas de escudo suprimidas). */
  noShields: boolean
  /** Relâmpago: melhor de 1 por rodada (chefe = melhor de 3). */
  blitz: boolean
  /** Chefes em dobro: a cada 3 rodadas. */
  doubleBoss: boolean
  /** Só ataque: oferta de boons sem defesa/escudo. */
  attackOnly: boolean
}

export const DEFAULT_CONFIG: RunConfig = {
  intensity: 1,
  noShields: false,
  blitz: false,
  doubleBoss: false,
  attackOnly: false,
}

/** Nível de ascensão (fixo na run) derivado do recorde — dificuldade permanente. */
export const gauntletAscension = (best: number): number => Math.floor(best / ASCENSION_PER)

/** Rodada-chefe? (a cada 5, ou a cada 3 com o mutador "chefes em dobro"). */
export function isBossRound(round: number, config: RunConfig = DEFAULT_CONFIG): boolean {
  return (round + 1) % (config.doubleBoss ? 3 : BOSS_EVERY) === 0
}

export interface Modifier {
  id: string
  emoji: string
  name: string
  desc: string
  /** Efeito no SEU time. */
  adjust?: GameAdjust
  /** Reforço no adversário. */
  opponentBump?: number
}

const MODIFIERS: Modifier[] = [
  { id: 'azarao', emoji: '🐺', name: 'Noite do azarão', desc: 'adversário mais forte', opponentBump: 6 },
  { id: 'maoFria', emoji: '🥶', name: 'Mão fria', desc: 'seu acerto cai', adjust: { make: -0.02 } },
  { id: 'garrafao', emoji: '🚫', name: 'Garrafão fechado', desc: 'menos bolas de 3', adjust: { threeBias: -0.06 } },
  { id: 'diaDe3', emoji: '🌧️', name: 'Dia de 3', desc: 'chuva de bola de 3', adjust: { threeBias: 0.06, make: 0.004 } },
  { id: 'maoQuente', emoji: '🔥', name: 'Mão quente', desc: 'seu acerto sobe', adjust: { make: 0.015 } },
  { id: 'acelerado', emoji: '⚡', name: 'Jogo acelerado', desc: 'mais posses', adjust: { pace: 6 } },
]

/** Modificador da rodada (determinístico) — só em rodadas normais, ~60% das vezes. */
export function roundModifier(seed: number, round: number, config: RunConfig = DEFAULT_CONFIG): Modifier | null {
  if (isBossRound(round, config)) return null
  const rng = mulberry32(hashString(`${seed}:mod:${round}`))
  if (rng() >= 0.6) return null
  return MODIFIERS[Math.floor(rng() * MODIFIERS.length)]
}

/** Tem evento (descanso/aposta) ANTES do boon nesta vitória? (não em rodada-chefe) */
export function isEventRound(seed: number, round: number, config: RunConfig = DEFAULT_CONFIG): boolean {
  if (isBossRound(round, config)) return false
  return mulberry32(hashString(`${seed}:evt:${round}`))() < EVENT_CHANCE
}

export interface RoundPlan {
  isBoss: boolean
  /** Vitórias para fechar a série (2 normal; 3 chefe = melhor de 5). */
  wins: number
  /** Reforço total no adversário (ascensão + chefe + azarão + aposta). */
  opponentBump: number
  modifier: Modifier | null
}

/**
 * Monta a rodada: chefe?, best-of, reforço do adversário e modificador. A dificuldade
 * efetiva = ascensão + intensidade escolhida (mesma rampa por rodada). Mutadores ajustam
 * cadência de chefe (doubleBoss) e o best-of (blitz).
 */
export function roundPlan(
  seed: number,
  round: number,
  ascension: number,
  config: RunConfig = DEFAULT_CONFIG,
  bet = false,
): RoundPlan {
  const boss = isBossRound(round, config)
  const modifier = roundModifier(seed, round, config)
  // Ascensão + intensidade CRESCEM com a rodada: 0 na rodada 1, cheias por volta da rampa.
  const tier = ascension + config.intensity
  let opponentBump = Math.round(tier * ASCENSION_BUMP * Math.min(1, round / ASCENSION_RAMP))
  if (boss) opponentBump += BOSS_BUMP
  if (bet) opponentBump += BET_BUMP
  if (modifier?.opponentBump) opponentBump += modifier.opponentBump
  const wins = config.blitz ? (boss ? 2 : 1) : boss ? BOSS_WINS : 2
  return { isBoss: boss, wins, opponentBump, modifier }
}
