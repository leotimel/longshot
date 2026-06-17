/**
 * Conquistas (mural) — metas derivadas do histórico, sem estado novo no engine.
 *
 * Tudo é calculado de `Stats` + o resumo re-simulado (`HistorySummary`): nenhuma
 * conquista é "gravada" como verdade; são funções puras do que já aconteceu, então
 * permanecem consistentes mesmo se a lógica mudar. A UI (ResultModal) marca as novas
 * comparando com o conjunto já visto (`longshot:achievements:v1`).
 */
import type { SchemeId } from '../engine/types'
import { summarizeHistory, type HistorySummary } from './playerHistory'
import type { Stats } from './storage'

export interface Achievement {
  id: string
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
    progressLabel: `${Math.min(cur, goal)}/${goal}`,
  }
}

/** Meta binária: pronta ou não, sem barra. */
const flag = (done: boolean): Pick<Achievement, 'done'> => ({ done })

/**
 * Calcula todas as conquistas. `hist` pode ser passado já pronto (o ResultModal
 * já o tem) para não re-simular duas vezes.
 */
export function computeAchievements(stats: Stats, hist?: HistorySummary): Achievement[] {
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

  return [
    { id: 'estreia', emoji: '🏀', name: 'Estreia', desc: 'Jogue seu primeiro dia.', ...flag(h.daysPlayed >= 1) },
    { id: 'campeao', emoji: '🏆', name: 'Campeão', desc: 'Vença um título nas Finals.', ...flag(titles >= 1) },
    { id: 'veterano', emoji: '🎖️', name: 'Veterano', desc: 'Jogue 50 dias.', ...tier(h.daysPlayed, 50) },
    { id: 'dinastia', emoji: '👑', name: 'Dinastia', desc: 'Conquiste 10 títulos.', ...tier(titles, 10) },
    { id: 'invicto', emoji: '💎', name: 'Invicto', desc: 'Termine uma campanha 16-0.', ...flag(h.perfectRuns >= 1) },
    { id: 'virada', emoji: '🔄', name: 'Virada épica', desc: 'Vença uma série após ficar 0-2.', ...flag(h.comebacks >= 1) },
    { id: 'estrategista', emoji: '🧠', name: 'Estrategista', desc: 'Use os 4 esquemas da prancheta.', ...tier(schemes.size, 4) },
    { id: 'sextoHomem', emoji: '🔁', name: 'Banco profundo', desc: 'Use um sexto homem no draft.', ...flag(usedSixthMan) },
    { id: 'maratona', emoji: '🔥', name: 'Maratona', desc: 'Mantenha um streak de 7 dias.', ...tier(stats.bestStreak, 7) },
    { id: 'viciado', emoji: '📅', name: 'Viciado', desc: 'Mantenha um streak de 30 dias.', ...tier(stats.bestStreak, 30) },
    { id: 'colecionador', emoji: '🃏', name: 'Colecionador', desc: 'Escale 25 jogadores diferentes.', ...tier(h.distinctPlayers, 25) },
    { id: 'cestinha', emoji: '🎯', name: 'Show de bola', desc: '50+ pontos de um jogador num jogo.', ...tier(h.recordGame?.points ?? 0, 50) },
    { id: 'duploDuplo', emoji: '📊', name: 'Duplo-duplo', desc: 'Um jogador com 10+ em duas estatísticas.', ...flag(h.doubleDoubles >= 1) },
    { id: 'daviGolias', emoji: '🪨', name: 'Davi vs Golias', desc: 'Vença a série de um time juggernaut.', ...flag(h.davidWins >= 1) },
    { id: 'lenda', emoji: '⭐', name: 'Lenda da casa', desc: 'Some 5000 pontos nas campanhas.', ...tier(h.totalPoints, 5000) },
  ]
}
