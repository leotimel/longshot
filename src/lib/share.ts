/**
 * Compartilhamento estilo Wordle — SEM revelar os adversários do dia.
 * Ex.: "Longshot #142 · 🥇 · 🔥9 | 🟩🟩🟩🟥"
 */
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

/** Monta o texto compartilhável do dia. Não inclui nomes de adversários. */
export function buildShareText(day: DayRecord, streak: number): string {
  const num = puzzleNumber(day.date)
  const selo = day.badge !== null ? BADGE_EMOJI[day.badge] : '💀'
  return `Longshot #${num} · ${selo} · 🔥${streak} | ${bracketRow(day.finalRound, day.champion)}`
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
