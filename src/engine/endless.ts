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

/** Times reais ordenados do mais fraco ao mais forte (base da escalada). */
const SORTED: readonly HistoricalTeam[] = [...TEAMS].sort((a, b) => power(a) - power(b))

/** Seed determinística da rodada `round` (0-based) de uma sessão. */
export function endlessSeed(sessionSeed: number, round: number): number {
  return hashString(`${sessionSeed}:gauntlet:${round}`)
}

/**
 * Adversário da rodada `round` (0-based): sobe ~1,6 posição de força por rodada
 * (com leve variação). Ultrapassado o topo do pool, devolve um clone do mais forte
 * com um bônus crescente nos ratings — escalada sem fim.
 */
export function endlessOpponent(sessionSeed: number, round: number): HistoricalTeam {
  const rng = mulberry32(endlessSeed(sessionSeed, round))
  const n = SORTED.length
  const idx = Math.round(round * 1.6 + rng() * 3)
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
 * Joga UMA rodada do gauntlet (melhor de 3) — determinística pela sessão+rodada.
 * Aplica a sinergia de era do quinteto somada ao `boost` da run (boons); sem
 * prancheta (quick-play). `attempt > 0` re-sorteia a MESMA rodada (retry com escudo)
 * sem mudar o adversário. Sem `boost`/`attempt` = comportamento original (baseline).
 *
 * @param boost   ajuste acumulado dos boons da run (ratings)
 * @param attempt nº da tentativa nesta rodada (0 = 1ª; >0 muda só a seed da série)
 */
export function simulateGauntletRound(
  team: Player[],
  sessionSeed: number,
  round: number,
  boost?: GameAdjust,
  attempt = 0,
): SeriesResult {
  const baseSeed =
    attempt === 0
      ? endlessSeed(sessionSeed, round)
      : hashString(`${sessionSeed}:gauntlet:${round}:a${attempt}`)
  return simulateSeries(
    team,
    endlessOpponent(sessionSeed, round),
    baseSeed,
    undefined,
    undefined,
    mergeAdjust(synergyAdjust(team), boost),
    GAUNTLET_WINS,
  )
}
