/**
 * Persistência do Longshot — 100% localStorage.
 *
 * Guarda streak, melhor streak, coleção de selos (🥉🥈🥇🏆 acumulados) e o
 * histórico por dia. O draft do dia trava ao ser confirmado: uma vez gravado,
 * não pode ser refeito. Resiliente a dados ausentes/corrompidos.
 */

const KEY = 'longshot:v1'

/** Registro de um dia jogado. `badge`: 0=🥉 1=🥈 2=🥇 3=🏆, null se caiu no First Round. */
export interface DayRecord {
  date: string
  picks: number[]
  finalRound: number
  champion: boolean
  badge: number | null
  /** Sal do pool usado no confirm — recompõe o mesmo sorteio no reload. */
  poolSalt?: string
}

export interface Stats {
  streak: number
  bestStreak: number
  /** Contagem acumulada por tipo de selo: [🥉, 🥈, 🥇, 🏆]. */
  badges: [number, number, number, number]
  history: Record<string, DayRecord>
}

function defaultStats(): Stats {
  return { streak: 0, bestStreak: 0, badges: [0, 0, 0, 0], history: {} }
}

/** Dia anterior (YYYY-MM-DD), calculado em UTC para evitar surpresas de fuso. */
function previousDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
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

  const playedYesterday = stats.history[previousDay(record.date)] !== undefined
  const streak = playedYesterday ? stats.streak + 1 : 1
  const badges = [...stats.badges] as [number, number, number, number]
  if (record.badge !== null) badges[record.badge] += 1

  const next: Stats = {
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
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
