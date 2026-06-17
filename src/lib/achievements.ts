/**
 * Conquistas (mural) — metas derivadas do histórico, sem estado novo no engine.
 *
 * Tudo é calculado de `Stats` + o resumo re-simulado (`HistorySummary`) + o recorde
 * do Gauntlet: nenhuma conquista é "gravada" como verdade; são funções puras do que
 * já aconteceu, então permanecem consistentes mesmo se a lógica mudar. A UI agrupa
 * por categoria e marca as novas comparando com o conjunto já visto.
 */
import type { SchemeId } from '../engine/types'
import { summarizeHistory, type HistorySummary } from './playerHistory'
import { getGauntletRecord, type Stats } from './storage'

export type AchCategory = 'carreira' | 'stats' | 'gauntlet'

/** Ordem e rótulos das categorias do mural. */
export const ACH_CATEGORIES: { id: AchCategory; label: string }[] = [
  { id: 'carreira', label: 'Carreira' },
  { id: 'stats', label: 'Estatísticas' },
  { id: 'gauntlet', label: 'Gauntlet' },
]

export interface Achievement {
  id: string
  category: AchCategory
  emoji: string
  name: string
  desc: string
  done: boolean
  /** Progresso 0–1 (para a barra das bloqueadas), quando a meta é cumulativa. */
  progress?: number
  /** Rótulo curto de progresso, ex.: "7/10". */
  progressLabel?: string
}

/** Meta cumulativa: pronta quando `cur ≥ goal`, com progresso e rótulo. */
function tier(cur: number, goal: number): Pick<Achievement, 'done' | 'progress' | 'progressLabel'> {
  return {
    done: cur >= goal,
    progress: Math.min(1, cur / goal),
    progressLabel: `${Math.min(Math.floor(cur), goal)}/${goal}`,
  }
}

/** Meta binária: pronta ou não, sem barra. */
const flag = (done: boolean): Pick<Achievement, 'done'> => ({ done })

/**
 * Calcula todas as conquistas. `hist` e `gauntletRecord` podem ser passados já
 * prontos (a UI já os tem) para não recomputar.
 */
export function computeAchievements(
  stats: Stats,
  hist?: HistorySummary,
  gauntletRecord: number = getGauntletRecord(),
): Achievement[] {
  const h = hist ?? summarizeHistory(stats.history)
  const days = Object.values(stats.history)

  // Sinais derivados direto do histórico cru (sem re-simular).
  let titles = 0
  let usedSixthMan = false
  const schemes = new Set<SchemeId>()
  for (const d of days) {
    if (d.champion) titles += 1
    if (d.sixthManId) usedSixthMan = true
    if (d.tactics) {
      for (const t of Object.values(d.tactics)) if (t.scheme) schemes.add(t.scheme)
    }
  }
  const topScorerPts = h.scorers[0]?.points ?? 0

  return [
    // ── Carreira ──────────────────────────────────────────────────────────────
    { id: 'estreia', category: 'carreira', emoji: '🏀', name: 'Estreia', desc: 'Jogue seu primeiro dia.', ...flag(h.daysPlayed >= 1) },
    { id: 'campeao', category: 'carreira', emoji: '🏆', name: 'Campeão', desc: 'Vença um título nas Finals.', ...flag(titles >= 1) },
    { id: 'cleveland', category: 'carreira', emoji: '↩️', name: 'CLEVELAND! THIS IS FOR YOU!', desc: 'Vire um 3-1 nas Finais e seja campeão.', ...flag(h.finalsComebacks >= 1) },
    { id: 'invicto', category: 'carreira', emoji: '💎', name: 'Invicto', desc: 'Termine uma campanha 16-0.', ...flag(h.perfectRuns >= 1) },
    { id: 'virada', category: 'carreira', emoji: '🔄', name: 'Virada épica', desc: 'Vença uma série após ficar 0-2.', ...flag(h.comebacks >= 1) },
    { id: 'estrategista', category: 'carreira', emoji: '🧠', name: 'Estrategista', desc: 'Use os 4 esquemas da prancheta.', ...tier(schemes.size, 4) },
    { id: 'sextoHomem', category: 'carreira', emoji: '🪑', name: 'Banco profundo', desc: 'Use um sexto homem no draft.', ...flag(usedSixthMan) },
    { id: 'dinastia', category: 'carreira', emoji: '👑', name: 'Dinastia', desc: 'Conquiste 10 títulos.', ...tier(titles, 10) },
    { id: 'maratona', category: 'carreira', emoji: '🔥', name: 'Maratona', desc: 'Mantenha um streak de 7 dias.', ...tier(stats.bestStreak, 7) },
    { id: 'viciado', category: 'carreira', emoji: '📅', name: 'Viciado', desc: 'Mantenha um streak de 30 dias.', ...tier(stats.bestStreak, 30) },
    { id: 'colecionador', category: 'carreira', emoji: '🃏', name: 'Colecionador', desc: 'Escale 25 jogadores diferentes.', ...tier(h.distinctPlayers, 25) },
    { id: 'veterano', category: 'carreira', emoji: '🎖️', name: 'Veterano', desc: 'Jogue 50 dias.', ...tier(h.daysPlayed, 50) },

    // ── Estatísticas ──────────────────────────────────────────────────────────
    { id: 'cestinha', category: 'stats', emoji: '🎯', name: 'Show de bola', desc: '50+ pontos de um jogador num jogo.', ...tier(h.recordGame?.points ?? 0, 50) },
    { id: 'duploDuplo', category: 'stats', emoji: '📊', name: 'Duplo-duplo', desc: 'Um jogador com 10+ em duas estatísticas.', ...flag(h.doubleDoubles >= 1) },
    { id: 'triploDuplo', category: 'stats', emoji: '📈', name: 'Triplo-duplo', desc: 'Um jogador com 10+ em três estatísticas.', ...flag(h.tripleDoubles >= 1) },
    { id: 'reboteiro', category: 'stats', emoji: '💪', name: 'Dono das tábuas', desc: '20+ rebotes de um jogador num jogo.', ...tier(h.recordRebounds, 20) },
    { id: 'garcom', category: 'stats', emoji: '🤝', name: 'Garçom', desc: '15+ assistências de um jogador num jogo.', ...tier(h.recordAssists, 15) },
    { id: 'lenda', category: 'stats', emoji: '⭐', name: 'Lenda da casa', desc: 'Some 5000 pontos nas campanhas.', ...tier(h.totalPoints, 5000) },
    { id: 'artilheiro', category: 'stats', emoji: '🏹', name: 'Artilheiro da era', desc: 'Some 15000 pontos nas campanhas.', ...tier(h.totalPoints, 15000) },
    { id: 'maquina', category: 'stats', emoji: '⚙️', name: 'Máquina de pontos', desc: 'Some 40000 pontos nas campanhas.', ...tier(h.totalPoints, 40000) },
    { id: 'craqueCasa', category: 'stats', emoji: '🌟', name: 'Craque da casa', desc: '2000 pontos com um mesmo jogador.', ...tier(topScorerPts, 2000) },
    { id: 'idolo', category: 'stats', emoji: '🏵️', name: 'Ídolo eterno', desc: '5000 pontos com um mesmo jogador.', ...tier(topScorerPts, 5000) },
    { id: 'muralha', category: 'stats', emoji: '🧱', name: 'Muralha', desc: 'Some 5000 rebotes nas campanhas.', ...tier(h.totalRebounds, 5000) },
    { id: 'maestro', category: 'stats', emoji: '🎻', name: 'Maestro', desc: 'Some 3000 assistências nas campanhas.', ...tier(h.totalAssists, 3000) },

    // ── Gauntlet ──────────────────────────────────────────────────────────────
    { id: 'gauntletWin', category: 'gauntlet', emoji: '⚔️', name: 'Desafiante', desc: 'Vença sua 1ª rodada no Gauntlet.', ...flag(gauntletRecord >= 1) },
    { id: 'gauntlet5', category: 'gauntlet', emoji: '🪖', name: 'Sobrevivente', desc: 'Chegue à rodada 5 do Gauntlet.', ...tier(gauntletRecord, 5) },
    { id: 'gauntlet10', category: 'gauntlet', emoji: '🥊', name: 'Implacável', desc: 'Chegue à rodada 10 do Gauntlet.', ...tier(gauntletRecord, 10) },
    { id: 'gauntlet15', category: 'gauntlet', emoji: '🏔️', name: 'Maratonista', desc: 'Chegue à rodada 15 do Gauntlet.', ...tier(gauntletRecord, 15) },
    { id: 'gauntlet20', category: 'gauntlet', emoji: '💀', name: 'Imortal', desc: 'Chegue à rodada 20 do Gauntlet.', ...tier(gauntletRecord, 20) },
  ]
}
