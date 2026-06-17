/**
 * Gauntlet infinito — modo endless (sem data).
 *
 * Engine puro. Uma "run" enfrenta adversários em escalada de força infinita:
 * a cada rodada, um time histórico mais forte (e, passado o topo do pool, clones
 * turbinados dos mais fortes). Cada rodada é uma série curta (melhor de 3),
 * determinística pela seed da sessão + índice da rodada. Não toca o jogo diário.
 */
import type { GameAdjust, HistoricalTeam, Player, SeriesResult } from './types'
import { TEAMS } from './data/teams'
import { hashString } from './seed'
import { mulberry32 } from './rng'
import { simulateSeries } from './series'
import { mergeAdjust } from './tactics'
import { synergyAdjust } from './synergy'

/** Vitórias para fechar uma rodada do gauntlet (melhor de 3). */
export const GAUNTLET_WINS = 2

const power = (t: HistoricalTeam): number =>
  t.teamRatings.offense + t.teamRatings.defense + t.teamRatings.clutch

/**
 * Aumenta as ratings de um time (ataque/defesa/clutch) em `n`. As ratings NÃO são
 * clampadas no motor (só as probabilidades por arremesso), então `n` pode passar de
 * 99 — é como ascensão/chefes furam o teto e ficam sempre mais difíceis.
 */
function bumpTeam(t: HistoricalTeam, n: number): HistoricalTeam {
  if (n <= 0) return t
  const r = t.teamRatings
  return {
    ...t,
    id: `${t.id}+${n}`,
    teamRatings: { ...r, offense: r.offense + n, defense: r.defense + n, clutch: r.clutch + n },
  }
}

/** Adversário da rodada já reforçado (ascensão/chefe) — para exibir e simular igual. */
export function gauntletOpponent(sessionSeed: number, round: number, opponentBump = 0): HistoricalTeam {
  return bumpTeam(endlessOpponent(sessionSeed, round), opponentBump)
}

/** Opções de uma rodada do gauntlet (dificuldade extra + modificadores). */
export interface GauntletRoundOpts {
  /** Boost acumulado dos boons da run. */
  boost?: GameAdjust
  /** Modificador da rodada (player-side: mão fria, dia de 3…). */
  modifier?: GameAdjust
  /** Reforço no adversário (ascensão + chefe + azarão); pode passar de 99. */
  opponentBump?: number
  /** Vitórias para fechar a série (2 = melhor de 3; 3 = chefe melhor de 5). */
  wins?: number
  /** Tentativa nesta rodada (retry com escudo). */
  attempt?: number
}

/** Times reais ordenados do mais fraco ao mais forte (base da escalada). */
const SORTED: readonly HistoricalTeam[] = [...TEAMS].sort((a, b) => power(a) - power(b))

/** Seed determinística da rodada `round` (0-based) de uma sessão. */
export function endlessSeed(sessionSeed: number, round: number): number {
  return hashString(`${sessionSeed}:gauntlet:${round}`)
}

/**
 * Adversário da rodada `round` (0-based): sobe ~1,9 posição de força por rodada
 * (com leve variação) — chega aos times de elite por volta da rodada ~30.
 * Ultrapassado o topo do pool, devolve um clone do mais forte com um bônus crescente
 * (até o teto de rating 99) — escalada sem fim.
 */
export function endlessOpponent(sessionSeed: number, round: number): HistoricalTeam {
  const rng = mulberry32(endlessSeed(sessionSeed, round))
  const n = SORTED.length
  const idx = Math.round(round * 1.9 + rng() * 3)
  const base = SORTED[Math.min(idx, n - 1)]
  const overflow = idx - (n - 1)
  if (overflow <= 0) return base

  const boost = Math.min(12, Math.ceil(overflow / 2))
  const r = base.teamRatings
  return {
    ...base,
    id: `${base.id}-g${round}`,
    teamRatings: {
      offense: Math.min(99, r.offense + boost),
      defense: Math.min(99, r.defense + boost),
      pace: r.pace,
      threePointRate: r.threePointRate,
      clutch: Math.min(99, r.clutch + boost),
    },
  }
}

/**
 * Joga UMA rodada do gauntlet — determinística pela sessão+rodada. Combina a sinergia
 * de era + boons da run + modificador da rodada (no time), e reforça o adversário pelo
 * `opponentBump` (ascensão/chefe). `attempt > 0` re-sorteia a MESMA rodada (retry com
 * escudo) sem mudar o adversário. Opções vazias = comportamento original (baseline).
 */
export function simulateGauntletRound(
  team: Player[],
  sessionSeed: number,
  round: number,
  opts: GauntletRoundOpts = {},
): SeriesResult {
  const { boost, modifier, opponentBump = 0, wins = GAUNTLET_WINS, attempt = 0 } = opts
  const baseSeed =
    attempt === 0
      ? endlessSeed(sessionSeed, round)
      : hashString(`${sessionSeed}:gauntlet:${round}:a${attempt}`)
  const adjust = mergeAdjust(mergeAdjust(synergyAdjust(team), boost), modifier)
  return simulateSeries(
    team,
    gauntletOpponent(sessionSeed, round, opponentBump),
    baseSeed,
    undefined,
    undefined,
    adjust,
    wins,
  )
}
