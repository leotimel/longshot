/**
 * Persistência do Longshot — 100% localStorage.
 *
 * Guarda streak, melhor streak, coleção de selos (🥉🥈🥇🏆 acumulados) e o
 * histórico por dia. O draft do dia trava ao ser confirmado: uma vez gravado,
 * não pode ser refeito. Resiliente a dados ausentes/corrompidos.
 */

import type { BracketTactics } from '../engine/types'

const KEY = 'longshot:v2'

/** Registro de um dia jogado. `badge`: 0=🥉 1=🥈 2=🥇 3=🏆, null se caiu no First Round. */
export interface DayRecord {
  date: string
  /** Ids dos 5 jogadores draftados — recompõe o time no reload. */
  team: string[]
  finalRound: number
  champion: boolean
  badge: number | null
  /** Táticas usadas (prancheta) — recompõem o resultado de forma determinística. */
  tactics?: BracketTactics
  /** Id do sexto homem draftado (reserva), se houver. */
  sixthManId?: string
  /** Temporada invicta (16-0): campeão sem perder nenhum jogo. */
  perfect?: boolean
}

export interface Stats {
  streak: number
  bestStreak: number
  /** Contagem acumulada por tipo de selo: [🥉, 🥈, 🥇, 🏆]. */
  badges: [number, number, number, number]
  /** Escudos: protegem o streak ao pular dias. Ganha 1 a cada 10 dias (máx 2). */
  freezes: number
  history: Record<string, DayRecord>
}

function defaultStats(): Stats {
  return { streak: 0, bestStreak: 0, badges: [0, 0, 0, 0], freezes: 0, history: {} }
}

/** Diferença em dias entre duas datas YYYY-MM-DD (a − b), em UTC. */
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000)
}

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultStats()
    const p = JSON.parse(raw) as Partial<Stats>
    return {
      streak: typeof p.streak === 'number' ? p.streak : 0,
      bestStreak: typeof p.bestStreak === 'number' ? p.bestStreak : 0,
      badges:
        Array.isArray(p.badges) && p.badges.length === 4
          ? (p.badges as [number, number, number, number])
          : [0, 0, 0, 0],
      freezes: typeof p.freezes === 'number' ? p.freezes : 0,
      history:
        p.history && typeof p.history === 'object'
          ? (p.history as Record<string, DayRecord>)
          : {},
    }
  } catch {
    return defaultStats()
  }
}

function save(stats: Stats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats))
  } catch {
    // ignora (quota cheia / modo privado)
  }
}

export function getDay(date: string): DayRecord | undefined {
  return loadStats().history[date]
}

/** O draft do dia já foi confirmado (e portanto travado)? */
export function isLocked(date: string): boolean {
  return getDay(date) !== undefined
}

/**
 * Confirma e TRAVA o dia: grava o registro, atualiza streak e selos. Se o dia
 * já estiver travado, não faz nada (não permite refazer). Retorna o Stats novo.
 */
export function confirmDay(record: DayRecord): Stats {
  const stats = loadStats()
  if (stats.history[record.date]) return stats // já travado

  // Streak: dia consecutivo soma; lacuna pode ser coberta por escudos.
  const playedDates = Object.keys(stats.history)
  let freezes = stats.freezes
  let streak: number
  if (playedDates.length === 0) {
    streak = 1
  } else {
    const lastPlayed = [...playedDates].sort().at(-1)!
    const missed = dayDiff(record.date, lastPlayed) - 1 // dias pulados
    if (missed <= 0) {
      streak = stats.streak + 1
    } else if (freezes >= missed) {
      streak = stats.streak + 1
      freezes -= missed // gasta escudos para preservar o streak
    } else {
      streak = 1
    }
  }

  // Ganha 1 escudo a cada 10 dias jogados (máx 2).
  const daysPlayed = playedDates.length + 1
  if (daysPlayed % 10 === 0) freezes = Math.min(2, freezes + 1)

  const badges = [...stats.badges] as [number, number, number, number]
  if (record.badge !== null) badges[record.badge] += 1

  const next: Stats = {
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    badges,
    freezes,
    history: { ...stats.history, [record.date]: record },
  }
  save(next)
  return next
}

/**
 * Reescreve o registro do dia com o resultado FINAL (após as táticas), ajustando
 * a contagem de selos pelo delta (baseline → final). Streak já foi contado no
 * confirm. Usado ao terminar a revelação do playoff.
 */
export function finalizeDay(record: DayRecord): Stats {
  const stats = loadStats()
  const prevBadge = stats.history[record.date]?.badge ?? null
  const badges = [...stats.badges] as [number, number, number, number]
  if (prevBadge !== record.badge) {
    if (prevBadge !== null) badges[prevBadge] = Math.max(0, badges[prevBadge] - 1)
    if (record.badge !== null) badges[record.badge] += 1
  }
  const next: Stats = {
    ...stats,
    badges,
    history: { ...stats.history, [record.date]: record },
  }
  save(next)
  return next
}

const ONBOARDED_KEY = 'longshot:onboarded:v1'

/** O jogador já viu o "como jogar"? */
export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1'
  } catch {
    return false
  }
}

export function setOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1')
  } catch {
    // ignora (quota cheia / modo privado)
  }
}

const COACHTIP_KEY = 'longshot:coachtip:v1'

/** O jogador já viu o guia da prancheta (abre sozinho na 1ª vez)? */
export function hasSeenCoachTip(): boolean {
  try {
    return localStorage.getItem(COACHTIP_KEY) === '1'
  } catch {
    return false
  }
}

export function setSeenCoachTip(): void {
  try {
    localStorage.setItem(COACHTIP_KEY, '1')
  } catch {
    // ignora (quota cheia / modo privado)
  }
}

const PLAYER_KEY = 'longshot:player:v1'

/**
 * Sal estável por jogador (gerado uma vez e guardado) — personaliza o sorteio
 * do pool de jogadores. É só um id local; o motor segue determinístico.
 */
export function getPlayerSeed(): string {
  try {
    const existing = localStorage.getItem(PLAYER_KEY)
    if (existing) return existing
    const seed = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
    localStorage.setItem(PLAYER_KEY, seed)
    return seed
  } catch {
    return ''
  }
}

const SKIN_KEY = 'longshot:skin:v1'
const FRAME_KEY = 'longshot:frame:v1'

/** Cosmético selecionado (skin/moldura). Só a escolha persiste; o unlock é derivado do nível. */
function getCosmetic(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function setCosmetic(key: string, id: string): void {
  try {
    localStorage.setItem(key, id)
  } catch {
    // ignora (quota cheia / modo privado)
  }
}

export const getSkin = (): string => getCosmetic(SKIN_KEY, 'hardwood')
export const setSkin = (id: string): void => setCosmetic(SKIN_KEY, id)
export const getFrame = (): string => getCosmetic(FRAME_KEY, 'none')
export const setFrame = (id: string): void => setCosmetic(FRAME_KEY, id)

const GAUNTLET_KEY = 'longshot:gauntlet:v1' // legado: só o recorde (número)
const GAUNTLET_KEY_V2 = 'longshot:gauntlet:v2'

/** Estatísticas acumuladas do Gauntlet (todas as runs). */
export interface GauntletStats {
  /** Nº de runs encerradas. */
  runs: number
  /** Soma de rodadas vencidas em todas as runs (p/ média). */
  totalRounds: number
  /** Maior nº de rodadas vencidas numa run (recorde). */
  best: number
}

/** Lê as stats do Gauntlet, migrando do formato v1 (só o recorde) se preciso. */
export function getGauntletStats(): GauntletStats {
  try {
    const raw = localStorage.getItem(GAUNTLET_KEY_V2)
    if (raw) {
      const p = JSON.parse(raw) as Partial<GauntletStats>
      return {
        runs: typeof p.runs === 'number' && p.runs >= 0 ? p.runs : 0,
        totalRounds: typeof p.totalRounds === 'number' && p.totalRounds >= 0 ? p.totalRounds : 0,
        best: typeof p.best === 'number' && p.best >= 0 ? p.best : 0,
      }
    }
    // Migração do v1: só havia o recorde.
    const legacy = localStorage.getItem(GAUNTLET_KEY)
    const n = legacy ? JSON.parse(legacy) : 0
    const best = typeof n === 'number' && n >= 0 ? n : 0
    return { runs: 0, totalRounds: 0, best }
  } catch {
    return { runs: 0, totalRounds: 0, best: 0 }
  }
}

/** Recorde do Gauntlet (maior nº de rodadas vencidas). Usado pelas conquistas. */
export function getGauntletRecord(): number {
  return getGauntletStats().best
}

/** Registra o fim de uma run (rodadas vencidas) e retorna as stats atualizadas. */
export function recordGauntletRun(rounds: number): GauntletStats {
  const prev = getGauntletStats()
  const next: GauntletStats = {
    runs: prev.runs + 1,
    totalRounds: prev.totalRounds + Math.max(0, rounds),
    best: Math.max(prev.best, rounds),
  }
  try {
    localStorage.setItem(GAUNTLET_KEY_V2, JSON.stringify(next))
  } catch {
    // ignora (quota cheia / modo privado)
  }
  return next
}

const ACHIEVEMENTS_KEY = 'longshot:achievements:v1'

/** Ids das conquistas que o jogador já viu desbloqueadas (para destacar as novas). */
export function getSeenAchievements(): string[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as string[]) : []
  } catch {
    return []
  }
}

export function setSeenAchievements(ids: string[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids))
  } catch {
    // ignora (quota cheia / modo privado)
  }
}
