/**
 * Motor de simulação de jogo — o coração do Longshot.
 *
 * Engine puro (sem DOM, sem Math.random). `simulateGame` joga ~100 possessões
 * por time (ritmo NBA real), determinístico pela seed, e devolve placar,
 * play-by-play resumido e o box score (pontos por jogador) do time draftado.
 *
 * O time do jogador é "home"; o adversário histórico é "away" e pontua em nível
 * de time (sem roster individual → sem box score). A soma do box score é igual
 * ao homeScore.
 *
 * Coeficientes calibrados no CHECKPOINT da Fase 2 (placares ~95-110, 3s por era,
 * clutch nos minutos finais). As faixas de clamp documentam os limites de cada
 * evento.
 */
import type {
  BoxScoreEntry,
  GameAdjust,
  GameResult,
  HistoricalTeam,
  Player,
  PlayerRatings,
} from './types'
import { mulberry32 } from './rng'

const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x))

/** Vantagem do quinteto montado: 5 estrelas jogam acima da média de seus ratings. */
const PLAYER_MAKE_BONUS = 0.065

/** Média de um rating entre os jogadores do time. */
function avg(team: Player[], key: keyof PlayerRatings): number {
  if (team.length === 0) return 0
  let sum = 0
  for (const p of team) sum += p.ratings[key]
  return sum / team.length
}

/** Escolhe um item proporcional aos pesos, usando `rng`. */
function weightedPick<T>(items: T[], weights: number[], rng: () => number): T {
  let total = 0
  for (const w of weights) total += w
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r < 0) return items[i]
  }
  return items[items.length - 1]
}

/** Nome curto do time (última palavra): "Chicago Bulls" → "Bulls". */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1]
}

interface Play {
  text: string
  three: boolean
}

/**
 * Reduz os destaques para ~max strings. Garante alguns arremessos de 3
 * (espalhados pelo jogo), sempre inclui o placar final, e completa com cestas
 * distribuídas no tempo — sem deixar os 3s dominarem o feed.
 */
function summarize(plays: Play[], max: number): string[] {
  if (plays.length <= max) return plays.map((p) => p.text)

  const picks = new Set<number>()
  picks.add(plays.length - 1) // placar final

  // Alguns arremessos de 3, amostrados espalhados pelo jogo (no máx. ~1/4).
  const threes = plays
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.three)
    .map((x) => x.i)
  const budget = Math.min(threes.length, Math.floor(max * 0.25))
  for (let k = 0; k < budget; k++) {
    picks.add(threes[Math.floor((k / budget) * threes.length)])
  }

  // Completa com cestas distribuídas no tempo.
  for (let k = 0; picks.size < max && k < max; k++) {
    picks.add(Math.floor((k / max) * plays.length))
  }

  return [...picks]
    .sort((a, b) => a - b)
    .slice(0, max)
    .map((i) => plays[i].text)
}

/**
 * Simula um jogo entre o time draftado e um time histórico.
 *
 * @param playerTeam o quinteto do jogador
 * @param opponent   o time histórico adversário
 * @param seed       seed numérica → mesmo seed = mesmo resultado
 */
export function simulateGame(
  playerTeam: Player[],
  opponent: HistoricalTeam,
  seed: number,
  adjust?: GameAdjust,
): GameResult {
  const rng = mulberry32(seed)

  // Quinteto em quadra (sexto homem pode trocar uma posição) + deltas táticos.
  const roster = adjust?.lineup ?? playerTeam
  const makeAdj = adjust?.make ?? 0
  const threeBias = adjust?.threeBias ?? 0

  // Agregados do time do jogador (com ajustes táticos).
  const teamDef = avg(roster, 'defense') + (adjust?.defense ?? 0)
  const teamPassing = avg(roster, 'passing')
  const teamClutch = avg(roster, 'clutch') + (adjust?.clutch ?? 0)

  // Pesos de uso: estrelas pontuam mais (box score mais interessante). O foco
  // (isolar/takeover) amplia o uso de um jogador.
  const usage = roster.map((p) => {
    const base = p.ratings.shooting + 0.4 * p.ratings.threePoint + 0.3 * p.ratings.speed
    return adjust?.focusId === p.id ? base * (adjust.focusBoost ?? 1) : base
  })

  const opp = opponent.teamRatings
  const oppShort = shortName(opponent.name)

  const points = new Map<string, number>()
  for (const p of roster) points.set(p.id, 0)

  let playerScore = 0
  let oppScore = 0
  const plays: Play[] = []

  // ~100 posses/time (ritmo NBA). Clutch = ~2 min finais (escala com as posses).
  const poss = Math.max(40, Math.round(92 + (opp.pace / 100) * 14) + (adjust?.pace ?? 0))
  const clutchWindow = Math.max(2, Math.round(poss / 24))

  for (let m = 0; m < poss; m++) {
    const quarter = Math.min(4, Math.floor((m / poss) * 4) + 1)
    const isClutch = m >= poss - clutchWindow

    // ── Possessão do time do jogador (ataque vs defesa do histórico) ──
    const clutchP = isClutch ? (teamClutch - opp.clutch) / 400 : 0
    if (rng() >= clamp(0.12 + (opp.defense - teamPassing) / 500, 0.05, 0.24)) {
      const shooter = weightedPick(roster, usage, rng)
      const sr = shooter.ratings
      let made = 0
      let three = false
      const kind = rng()
      if (kind < 0.12) {
        const pFt = clamp(0.55 + sr.shooting / 250, 0.5, 0.92)
        if (rng() < pFt) made += 1
        if (rng() < pFt) made += 1
      } else if (rng() < clamp(0.22 + (sr.threePoint - 55) / 180 + threeBias, 0.1, 0.58)) {
        if (rng() < clamp(0.35 + (sr.threePoint - opp.defense) / 340 + clutchP + PLAYER_MAKE_BONUS + makeAdj, 0.24, 0.54)) {
          made = 3
          three = true
        }
      } else if (rng() < clamp(0.47 + (sr.shooting - opp.defense) / 300 + clutchP + PLAYER_MAKE_BONUS + makeAdj, 0.32, 0.7)) {
        made = 2
      }
      if (made > 0) {
        playerScore += made
        points.set(shooter.id, (points.get(shooter.id) ?? 0) + made)
        plays.push({
          text: `Q${quarter} · ${shooter.name} ${three ? 'crava de 3' : `anota ${made}`} · ${oppShort} ${oppScore}-${playerScore}`,
          three,
        })
      }
    }

    // ── Possessão do adversário (nível de time vs defesa agregada) ──
    const clutchO = isClutch ? (opp.clutch - teamClutch) / 400 : 0
    if (rng() >= clamp(0.135 + (teamDef - opp.offense) / 500, 0.05, 0.24)) {
      let made = 0
      let three = false
      const kind = rng()
      if (kind < 0.12) {
        const pFt = clamp(0.55 + opp.offense / 250, 0.5, 0.9)
        if (rng() < pFt) made += 1
        if (rng() < pFt) made += 1
      } else if (rng() < clamp(0.12 + (opp.threePointRate - 38) / 170, 0.06, 0.58)) {
        if (rng() < clamp(0.35 + (opp.offense - teamDef) / 340 + clutchO, 0.24, 0.52)) {
          made = 3
          three = true
        }
      } else if (rng() < clamp(0.47 + (opp.offense - teamDef) / 300 + clutchO, 0.32, 0.68)) {
        made = 2
      }
      if (made > 0) {
        oppScore += made
        plays.push({
          text: `Q${quarter} · ${oppShort} ${three ? 'crava de 3' : `marca ${made}`} · ${oppShort} ${oppScore}-${playerScore}`,
          three,
        })
      }
    }
  }

  const boxScore: BoxScoreEntry[] = roster.map((p) => ({
    playerId: p.id,
    name: p.name,
    points: points.get(p.id) ?? 0,
  }))

  return {
    homeScore: playerScore,
    awayScore: oppScore,
    playByPlay: summarize(plays, 10),
    boxScore,
  }
}
