import { useCallback, useMemo, useState } from 'react'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import { playerById } from '../engine/data/rosters'
import type { BracketResult, BracketTactics, Player, SeriesTactics } from '../engine/types'
import { levelForXp, totalXpFromHistory, xpForDay, type LevelInfo } from '../lib/level'
import { COACH_TOKENS, takeoverUsed, tokensLeft, tokensSpent } from '../lib/tactics'
import {
  confirmDay,
  finalizeDay,
  getDay,
  getPlayerSeed,
  loadStats,
  type DayRecord,
  type Stats,
} from '../lib/storage'

function badgeFor(result: BracketResult): { finalRound: number; champion: boolean; badge: number | null } {
  const roundsWon = result.rounds.filter((r) => r.winner === 'player').length
  return { finalRound: result.rounds.length, champion: result.champion, badge: roundsWon > 0 ? roundsWon - 1 : null }
}

/**
 * Orquestra o dia: draft, trava o time ao confirmar, roda o motor e salva o
 * resultado. A "prancheta" (táticas) é aplicada DURANTE a revelação e recompõe o
 * bracket; o resultado final (com táticas) é gravado ao terminar.
 */
export function usePlayoff(date: string) {
  const playerSeed = useMemo(() => getPlayerSeed(), [])
  const draft = useMemo(() => dailyDraft(date, playerSeed), [date, playerSeed])
  const [day, setDay] = useState<DayRecord | undefined>(() => getDay(date))
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [justConfirmed, setJustConfirmed] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [prevStats, setPrevStats] = useState<Stats | null>(null)
  // Táticas do dia (vivas durante a revelação; em revisita vêm do registro salvo).
  const [tactics, setTactics] = useState<BracketTactics>(() => getDay(date)?.tactics ?? {})

  // Quinteto travado + sexto homem, reconstruídos dos ids salvos.
  const team = useMemo<Player[] | undefined>(() => {
    if (!day) return undefined
    const players = day.team.map((id) => playerById(id)).filter((p): p is Player => p !== undefined)
    return players.length === day.team.length ? players : undefined
  }, [day])
  const sixthMan = useMemo(() => (day?.sixthManId ? playerById(day.sixthManId) : undefined), [day])

  const bracket = useMemo<BracketResult | null>(() => {
    if (!team) return null
    return simulateBracket(team, date, tactics, sixthMan)
  }, [team, date, tactics, sixthMan])

  const confirm = useCallback(
    (picked: Player[], sixthManId?: string) => {
      if (getDay(date)) return // já travado: não permite refazer
      const result = simulateBracket(picked, date) // baseline (sem táticas ainda)
      const record: DayRecord = {
        date,
        team: picked.map((p) => p.id),
        sixthManId,
        ...badgeFor(result),
      }
      setPrevStats(loadStats()) // foto da carreira ANTES de gravar hoje
      setStats(confirmDay(record))
      setDay(record)
      setTactics({})
      setJustConfirmed(true)
      setRevealing(true)
    },
    [date],
  )

  /** Aplica/atualiza uma tática de uma rodada (respeitando o orçamento de fichas). */
  const updateTactics = useCallback((round: number, patch: Partial<SeriesTactics>) => {
    setTactics((prev) => {
      const next = { ...prev, [round]: { ...prev[round], ...patch } }
      if (tokensSpent(next) > COACH_TOKENS) return prev // sem ficha
      return next
    })
  }, [])

  /** Encerra a revelação: grava o resultado FINAL (com táticas) e revela o dia. */
  const completeReveal = useCallback(() => {
    if (day && team) {
      const result = simulateBracket(team, date, tactics, sixthMan)
      const finalRec: DayRecord = { ...day, ...badgeFor(result), tactics }
      setStats(finalizeDay(finalRec))
      setDay(finalRec)
    }
    setRevealing(false)
  }, [day, team, date, tactics, sixthMan])

  // Nível derivado do histórico inteiro; XP de hoje e se o dia subiu o nível.
  const level = useMemo<LevelInfo>(() => levelForXp(totalXpFromHistory(Object.values(stats.history))), [stats])
  const todayXp = day ? xpForDay(day) : 0
  const leveledUp = useMemo(() => {
    if (!day) return false
    return level.level > levelForXp(level.totalXp - todayXp).level
  }, [day, level, todayXp])

  // Valores de EXIBIÇÃO: durante a revelação mostram a carreira pré-hoje.
  const displayStats = revealing && prevStats ? prevStats : stats
  const displayDay = revealing ? undefined : day
  const displayLevel = useMemo<LevelInfo>(
    () => levelForXp(totalXpFromHistory(Object.values(displayStats.history))),
    [displayStats],
  )
  const displayLeveledUp = revealing ? false : leveledUp
  const displayTodayXp = revealing ? 0 : todayXp

  return {
    draft,
    locked: day !== undefined,
    day,
    team,
    sixthMan,
    bracket,
    stats,
    level,
    todayXp,
    leveledUp,
    displayStats,
    displayDay,
    displayLevel,
    displayLeveledUp,
    displayTodayXp,
    // Prancheta
    tactics,
    fichas: tokensLeft(tactics),
    takeoverDone: takeoverUsed(tactics),
    updateTactics,
    completeReveal,
    confirm,
    justConfirmed,
  }
}
