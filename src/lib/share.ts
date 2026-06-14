/**
 * Compartilhamento estilo Wordle — SEM revelar os adversários do dia.
 * Ex.: "Longshot #142 · 🥇 · 🔥9 | 🟩🟩🟩🟥" + prévia do quinteto.
 */
import type { Player } from '../engine/types'
import { playerById } from '../engine/data/rosters'
import { overall } from './playerStats'
import type { DayRecord } from './storage'
import { BADGE_EMOJI } from './badges'

/** Epoch do jogo: 2026-06-01 é o Longshot #1. */
export const LONGSHOT_EPOCH = '2026-06-01'

const DAY_MS = 86_400_000

function utcDayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS)
}

/** Número do puzzle do dia (Longshot #N), contado a partir do epoch. */
export function puzzleNumber(date: string): number {
  return utcDayIndex(date) - utcDayIndex(LONGSHOT_EPOCH) + 1
}

/** Linha de 4 emojis do bracket: 🟩 vitória · 🟥 derrota · ⬜ não jogada. */
function bracketRow(finalRound: number, champion: boolean): string {
  let row = ''
  for (let i = 0; i < 4; i++) {
    if (i >= finalRound) row += '⬜'
    else if (champion || i < finalRound - 1) row += '🟩'
    else row += '🟥'
  }
  return row
}

const surname = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

/**
 * Prévia do quinteto do dia (sobrenome + overall, alinhados, + média) para comparar
 * times. Só do PRÓPRIO time — não revela adversários. Se algum id não resolver,
 * devolve `[]` (sem prévia), preservando o cabeçalho.
 */
function lineupLines(team: string[]): string[] {
  const players = team.map((id) => playerById(id)).filter((p): p is Player => p !== undefined)
  if (players.length !== team.length) return []

  const names = players.map((p) => surname(p.name))
  const width = Math.max(...names.map((n) => n.length))
  const lines = players.map((p, i) => `${names[i].padEnd(width)} ${overall(p)}`)

  const avg = Math.round(players.reduce((sum, p) => sum + overall(p), 0) / players.length)
  lines.push(`Quinteto ${avg} OVR`)
  return lines
}

/** Monta o texto compartilhável do dia. Não inclui nomes de adversários. */
export function buildShareText(day: DayRecord, streak: number): string {
  const num = puzzleNumber(day.date)
  const selo = day.badge !== null ? BADGE_EMOJI[day.badge] : '💀'
  const head = `Longshot #${num} · ${selo} · 🔥${streak} | ${bracketRow(day.finalRound, day.champion)}`
  const preview = lineupLines(day.team)
  return preview.length > 0 ? `${head}\n${preview.join('\n')}` : head
}

/** Tenta compartilhar via Web Share API, caindo para o clipboard. */
export async function shareText(text: string): Promise<void> {
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return
    }
  } catch {
    // usuário cancelou ou a API falhou → cai pro clipboard
  }
  try {
    await navigator.clipboard?.writeText(text)
  } catch {
    // sem clipboard disponível
  }
}
