/**
 * Nível do jogador (XP & patentes) — 100% local, derivado do histórico. Premia ir
 * mais longe no playoff: quanto mais rodadas vencidas no dia, mais XP (curva
 * íngreme — o campeão vale bem mais). Fora do engine; espelha `lib/level.ts` do Taut.
 */
import type { DayRecord } from './storage'

/** Rodadas vencidas no dia (0 = eliminado no First Round; 4 = campeão). */
export function roundsWon(r: DayRecord): number {
  if (r.champion) return 4
  return r.badge === null ? 0 : r.badge + 1
}

/** XP do dia por rodadas vencidas (índice 0..4) — íngreme no fim. */
export const XP_BY_ROUNDS = [10, 20, 35, 55, 85] as const

export function xpForDay(r: DayRecord): number {
  return XP_BY_ROUNDS[Math.min(XP_BY_ROUNDS.length - 1, Math.max(0, roundsWon(r)))]
}

/** Soma o XP de todos os dias do histórico. */
export function totalXpFromHistory(history: DayRecord[]): number {
  return history.reduce((sum, r) => sum + xpForDay(r), 0)
}

// --- Curva de nível ---

export const XP_FIRST = 60 // custo do 1º nível (Nv1 → Nv2)
export const XP_GROWTH = 15 // crescimento por nível…
export const XP_CAP = 150 // …até este teto (depois fica ~constante)

/** XP necessário pra subir do nível `level` pro próximo. */
export function xpToNext(level: number): number {
  return Math.min(XP_CAP, XP_FIRST + XP_GROWTH * (level - 1))
}

/** Patentes (tema Carreira NBA) com emblema/flair. Entre marcos vale o último. */
export const LANDMARKS: ReadonlyArray<{ level: number; name: string; emblem: string }> = [
  { level: 1, name: 'Rookie', emblem: '🏀' },
  { level: 5, name: 'Role Player', emblem: '👟' },
  { level: 10, name: 'Starter', emblem: '⭐' },
  { level: 20, name: 'All-Star', emblem: '🌟' },
  { level: 35, name: 'MVP', emblem: '👑' },
  { level: 50, name: 'Hall of Fame', emblem: '🏛️' },
  { level: 75, name: 'G.O.A.T.', emblem: '🐐' },
]

function landmarkForLevel(level: number): { name: string; emblem: string } {
  let lm = LANDMARKS[0]
  for (const cur of LANDMARKS) {
    if (level >= cur.level) lm = cur
  }
  return lm
}

export function codenameForLevel(level: number): string {
  return landmarkForLevel(level).name
}

export function emblemForLevel(level: number): string {
  return landmarkForLevel(level).emblem
}

/** O nível é um marco (ganha patente nova)? */
export function isLandmark(level: number): boolean {
  return LANDMARKS.some((lm) => lm.level === level)
}

export interface LevelInfo {
  level: number
  codename: string
  emblem: string
  /** XP acumulado DENTRO do nível atual. */
  xpInLevel: number
  /** XP necessário pra subir do nível atual. */
  xpForNext: number
  /** XP total acumulado. */
  totalXp: number
}

/** Deriva o nível (e o progresso dentro dele) a partir do XP total. */
export function levelForXp(totalXp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level)
    level++
  }
  return {
    level,
    codename: codenameForLevel(level),
    emblem: emblemForLevel(level),
    xpInLevel: remaining,
    xpForNext: xpToNext(level),
    totalXp: Math.max(0, Math.floor(totalXp)),
  }
}

/** Nível derivado do histórico inteiro. */
export function levelFromHistory(history: DayRecord[]): LevelInfo {
  return levelForXp(totalXpFromHistory(history))
}
