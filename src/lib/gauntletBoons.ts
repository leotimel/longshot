/**
 * Boons do Gauntlet — reforços de roguelike entre rodadas.
 *
 * Cada boon transforma o "build" da run (`RunBuild`): ratings viram um `GameAdjust`
 * acumulado (somado à sinergia e passado ao motor como `baseAdjust`), escudos são
 * vidas extras, e o Reforço troca o elo mais fraco do quinteto. Só de UI/estado;
 * o motor segue puro e determinístico.
 *
 * EQUILÍBRIO: cada atributo tem um TETO (`BOON_CAPS`) — empilhar o mesmo boon para
 * de fazer efeito ao atingir o teto (e some da oferta). Os escudos têm `SHIELD_CAP`.
 * O Reforço se auto-limita (só troca por alguém melhor → para quando o quinteto já é
 * o melhor disponível). Assim o build PLATEIA e os adversários (rating ≤ 99) seguem
 * sendo um desafio. Valores TUNÁVEIS abaixo.
 */
import type { GameAdjust, Player } from '../engine/types'
import { mulberry32, shuffle } from '../engine/rng'
import { hashString } from '../engine/seed'
import { overall } from './playerStats'
import { DEFAULT_CONFIG, type RunConfig } from './gauntletRun'

/** Estado acumulado de uma run do Gauntlet. */
export interface RunBuild {
  /** Ajustes de rating somados (boons), aplicados como `baseAdjust` no motor. */
  boost: GameAdjust
  /** Vidas extras: uma derrota gasta um escudo em vez de encerrar a run. */
  shields: number
  /** Quinteto atual (o Reforço pode trocar um jogador). */
  team: Player[]
}

export interface Boon {
  id: string
  emoji: string
  name: string
  desc: string
  apply: (s: RunBuild, pool: Player[]) => RunBuild
}

type CapKey = 'clutch' | 'make' | 'defense' | 'threeBias' | 'pace'

/** Teto acumulado por atributo (o build plateia aqui). Tunável. */
export const BOON_CAPS: Record<CapKey, number> = {
  clutch: 10,
  make: 0.02,
  defense: 8,
  threeBias: 0.06,
  pace: 6,
}

/** Máximo de escudos guardáveis. */
export const SHIELD_CAP = 3

/** Build inicial de uma run, a partir do quinteto draftado. */
export const initBuild = (team: Player[]): RunBuild => ({ boost: {}, shields: 0, team })

/** Soma um delta ao boost, respeitando o teto de cada atributo. */
function addBoost(s: RunBuild, delta: Partial<Record<CapKey, number>>): RunBuild {
  const boost: GameAdjust = { ...s.boost }
  for (const k of Object.keys(delta) as CapKey[]) {
    boost[k] = Math.min(BOON_CAPS[k], (boost[k] ?? 0) + (delta[k] ?? 0))
  }
  return { ...s, boost }
}

/** Troca o jogador de menor `overall` pelo melhor disponível da mesma posição. */
function reinforce(s: RunBuild, pool: Player[]): RunBuild {
  if (s.team.length === 0) return s
  const weakest = s.team.reduce((w, p) => (overall(p) < overall(w) ? p : w), s.team[0])
  const usedIds = new Set(s.team.map((p) => p.id))
  let best: Player | undefined
  for (const p of pool) {
    if (p.position !== weakest.position || usedIds.has(p.id)) continue
    if (!best || overall(p) > overall(best)) best = p
  }
  if (!best || overall(best) <= overall(weakest)) return s
  const team = s.team.map((p) => (p.id === weakest.id ? best! : p))
  return { ...s, team }
}

/** Catálogo de boons (repetíveis até o teto). Passos pequenos → ganho gradual. */
export const BOONS: Boon[] = [
  { id: 'garra', emoji: '⚡', name: 'Garra', desc: '+ clutch ao time', apply: (s) => addBoost(s, { clutch: 4 }) },
  { id: 'miraFina', emoji: '🎯', name: 'Mira fina', desc: '+ acerto ao time', apply: (s) => addBoost(s, { make: 0.008 }) },
  { id: 'muralha', emoji: '🛡️', name: 'Muralha', desc: '+ defesa ao time', apply: (s) => addBoost(s, { defense: 4 }) },
  { id: 'chuva3', emoji: '🌧️', name: 'Chuva de 3', desc: '+ bolas de 3', apply: (s) => addBoost(s, { threeBias: 0.03, make: 0.004 }) },
  { id: 'correria', emoji: '🏃', name: 'Correria', desc: '+ ritmo (limitado)', apply: (s) => addBoost(s, { pace: 3 }) },
  { id: 'folego', emoji: '🩹', name: 'Fôlego', desc: `+1 escudo (máx ${SHIELD_CAP})`, apply: (s) => ({ ...s, shields: Math.min(SHIELD_CAP, s.shields + 1) }) },
  { id: 'reforco', emoji: '🔁', name: 'Reforço', desc: 'troca o elo fraco por um craque', apply: reinforce },
]

const BY_ID = new Map(BOONS.map((b) => [b.id, b]))

/** Boon pelo id (ou undefined). */
export const boonById = (id: string): Boon | undefined => BY_ID.get(id)

/** Um boon ainda faz efeito neste build? (não atingiu o teto / há upgrade). */
export function boonEffective(boon: Boon, s: RunBuild, pool: Player[]): boolean {
  const n = boon.apply(s, pool)
  return (
    n.shields !== s.shields ||
    n.team.some((p, i) => p.id !== s.team[i]?.id) ||
    JSON.stringify(n.boost) !== JSON.stringify(s.boost)
  )
}

/**
 * Oferece até 3 boons distintos QUE AINDA FAZEM EFEITO neste build (determinístico
 * pela sessão+rodada). Respeita os mutadores: "sem escudos" tira o Fôlego; "só ataque"
 * tira Fôlego e Muralha. Pode devolver menos de 3 (ou 0) se nada mais faz efeito —
 * nesse caso a UI mostra "Avançar" direto.
 */
export function offerBoons(
  sessionSeed: number,
  round: number,
  s: RunBuild,
  pool: Player[],
  config: RunConfig = DEFAULT_CONFIG,
): Boon[] {
  const rng = mulberry32(hashString(`${sessionSeed}:boon:${round}`))
  const allowed = BOONS.filter((b) => {
    if ((config.noShields || config.attackOnly) && b.id === 'folego') return false
    if (config.attackOnly && b.id === 'muralha') return false
    return true
  })
  const usable = allowed.filter((b) => boonEffective(b, s, pool))
  return shuffle(usable, rng).slice(0, 3)
}
