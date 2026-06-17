/**
 * Compartilhamento estilo Wordle — SEM revelar os adversários do dia.
 * O cabeçalho e a linha de bolinhas ficam em linhas separadas (não quebram no chat),
 * seguidos da prévia do quinteto. Ex.:
 *   Longshot #142 · 🥇 · 🔥9 📋
 *   🟩🟩🟩🟥
 *   Curry 96 ...
 */
import type { Player } from '../engine/types'
import { playerById } from '../engine/data/rosters'
import { overall } from './playerStats'
import type { DayRecord } from './storage'
import { tokensSpent } from './tactics'
import { BADGE_EMOJI } from './badges'

/** Epoch do jogo: 2026-06-01 é o Longshot #1. */
export const LONGSHOT_EPOCH = '2026-06-01'

/** URL pública do jogo (link limpo no compartilhamento). */
export const LONGSHOT_URL = 'https://playlongshot.vercel.app'

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
 * Prévia do quinteto do dia (sobrenome + overall, um por linha, + média) para comparar
 * times. Sem alinhamento por espaços (entorta em fonte proporcional). Só do PRÓPRIO
 * time — não revela adversários. Se algum id não resolver, devolve `[]` (sem prévia).
 */
function lineupLines(team: string[]): string[] {
  const players = team.map((id) => playerById(id)).filter((p): p is Player => p !== undefined)
  if (players.length !== team.length) return []

  const lines = players.map((p) => `${surname(p.name)} ${overall(p)}`)
  const avg = Math.round(players.reduce((sum, p) => sum + overall(p), 0) / players.length)
  lines.push(`Quinteto ${avg} OVR`)
  return lines
}

/** Monta o texto compartilhável do dia. Não inclui nomes de adversários. */
export function buildShareText(day: DayRecord, streak: number): string {
  const num = puzzleNumber(day.date)
  const selo = day.badge !== null ? BADGE_EMOJI[day.badge] : '💀'
  const coached = tokensSpent(day.tactics ?? {}) > 0 ? ' 📋' : '' // usou a prancheta
  const invicto = day.perfect ? ' 🐐' : '' // temporada invicta (16-0)
  const head = `Longshot #${num} · ${selo} · 🔥${streak}${coached}${invicto}`
  return [head, bracketRow(day.finalRound, day.champion), ...lineupLines(day.team)].join('\n')
}

/** Texto compartilhável de uma run do Gauntlet (não revela adversários). */
export function buildGauntletShare(rounds: number, best: number): string {
  const head = `⚔️ Longshot Gauntlet`
  const line = `Sobrevivi a ${rounds} ${rounds === 1 ? 'rodada' : 'rodadas'}! 🔥 (recorde: ${best})`
  return [head, line, LONGSHOT_URL].join('\n')
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
