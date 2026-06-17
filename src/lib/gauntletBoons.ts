/**
 * Boons do Gauntlet — reforços de roguelike entre rodadas.
 *
 * Cada boon transforma o "build" da run (`RunBuild`): ratings viram um `GameAdjust`
 * acumulado (somado à sinergia e passado ao motor como `baseAdjust`), escudos são
 * vidas extras, e o Reforço troca o elo mais fraco do quinteto. Só de UI/estado;
 * o motor segue puro e determinístico.
 *
 * VALORES TUNÁVEIS: as magnitudes abaixo controlam o equilíbrio (buff vs escalada do
 * adversário). Ajustar aqui caso a run fique fácil/difícil demais.
 */
import type { GameAdjust, Player } from '../engine/types'
import { mergeAdjust } from '../engine/tactics'
import { mulberry32, shuffle } from '../engine/rng'
import { hashString } from '../engine/seed'
import { overall } from './playerStats'

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

/** Build inicial de uma run, a partir do quinteto draftado. */
export const initBuild = (team: Player[]): RunBuild => ({ boost: {}, shields: 0, team })

/** Soma um delta de rating ao boost acumulado. */
const addBoost = (s: RunBuild, delta: GameAdjust): RunBuild => ({
  ...s,
  boost: mergeAdjust(s.boost, delta) ?? s.boost,
})

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

/** Catálogo de boons (todos repetíveis). */
export const BOONS: Boon[] = [
  { id: 'garra', emoji: '⚡', name: 'Garra', desc: '+5 clutch ao time', apply: (s) => addBoost(s, { clutch: 5 }) },
  { id: 'miraFina', emoji: '🎯', name: 'Mira fina', desc: '+ acerto ao time', apply: (s) => addBoost(s, { make: 0.015 }) },
  { id: 'muralha', emoji: '🛡️', name: 'Muralha', desc: '+6 defesa ao time', apply: (s) => addBoost(s, { defense: 6 }) },
  { id: 'chuva3', emoji: '🌧️', name: 'Chuva de 3', desc: '+ bolas de 3 e acerto', apply: (s) => addBoost(s, { threeBias: 0.04, make: 0.005 }) },
  { id: 'correria', emoji: '🏃', name: 'Correria', desc: '+ ritmo (mais posses)', apply: (s) => addBoost(s, { pace: 4 }) },
  { id: 'folego', emoji: '🩹', name: 'Fôlego', desc: '+1 escudo (vida extra)', apply: (s) => ({ ...s, shields: s.shields + 1 }) },
  { id: 'reforco', emoji: '🔁', name: 'Reforço', desc: 'troca o elo fraco por um craque', apply: reinforce },
]

const BY_ID = new Map(BOONS.map((b) => [b.id, b]))

/** Boon pelo id (ou undefined). */
export const boonById = (id: string): Boon | undefined => BY_ID.get(id)

/**
 * Oferece 3 boons distintos para a rodada (determinístico pela sessão+rodada).
 */
export function offerBoons(sessionSeed: number, round: number): Boon[] {
  const rng = mulberry32(hashString(`${sessionSeed}:boon:${round}`))
  return shuffle(BOONS, rng).slice(0, 3)
}
