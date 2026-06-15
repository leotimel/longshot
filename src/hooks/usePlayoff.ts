import { useCallback, useMemo, useState } from 'react'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import { playerById } from '../engine/data/rosters'
import type { BracketResult, Player } from '../engine/types'
import { levelForXp, totalXpFromHistory, xpForDay, type LevelInfo } from '../lib/level'
import {
  confirmDay,
  getDay,
  getPlayerSeed,
  loadStats,
  type DayRecord,
  type Stats,
} from '../lib/storage'

/**
 * Orquestra o dia: carrega o draft (times por jogador, adversários pela data),
 * sabe se já foi confirmado (→ direto ao bracket), trava o time ao confirmar,
 * roda o motor e salva resultado + selo.
 *
 * O bracket é recomputado a partir dos ids salvos (via `playerById`) — nada de
 * simulação é persistido.
 */
export function usePlayoff(date: string) {
  const playerSeed = useMemo(() => getPlayerSeed(), [])
  const draft = useMemo(() => dailyDraft(date, playerSeed), [date, playerSeed])
  const [day, setDay] = useState<DayRecord | undefined>(() => getDay(date))
  const [stats, setStats] = useState<Stats>(() => loadStats())
  // true só na sessão que acabou de confirmar → habilita revelação gradual.
  const [justConfirmed, setJustConfirmed] = useState(false)
  // Enquanto revela o playoff jogo a jogo, NÃO mostrar o resultado/XP de hoje
  // (selo, modal). `prevStats` = foto da carreira ANTES de hoje.
  const [revealing, setRevealing] = useState(false)
  const [prevStats, setPrevStats] = useState<Stats | null>(null)
  const completeReveal = useCallback(() => setRevealing(false), [])

  // Quinteto travado do dia, reconstruído a partir dos ids salvos.
  const team = useMemo<Player[] | undefined>(() => {
    if (!day) return undefined
    const players = day.team
      .map((id) => playerById(id))
      .filter((p): p is Player => p !== undefined)
    return players.length === day.team.length ? players : undefined
  }, [day])

  const bracket = useMemo<BracketResult | null>(() => {
    if (!team) return null
    return simulateBracket(team, date)
  }, [team, date])

  const confirm = useCallback(
    (team: Player[]) => {
      if (getDay(date)) return // já travado: não permite refazer
      const result = simulateBracket(team, date)
      const roundsWon = result.rounds.filter((r) => r.winner === 'player').length
      const record: DayRecord = {
        date,
        team: team.map((p) => p.id),
        finalRound: result.rounds.length,
        champion: result.champion,
        badge: roundsWon > 0 ? roundsWon - 1 : null,
      }
      setPrevStats(loadStats()) // foto da carreira ANTES de gravar hoje
      setStats(confirmDay(record))
      setDay(record)
      setJustConfirmed(true)
      setRevealing(true)
    },
    [date],
  )

  // Nível derivado do histórico inteiro; XP de hoje e se o dia subiu o nível.
  const level = useMemo<LevelInfo>(() => levelForXp(totalXpFromHistory(Object.values(stats.history))), [stats])
  const todayXp = day ? xpForDay(day) : 0
  const leveledUp = useMemo(() => {
    if (!day) return false
    return level.level > levelForXp(level.totalXp - todayXp).level
  }, [day, level, todayXp])

  // Valores de EXIBIÇÃO: durante a revelação gradual mostram a carreira pré-hoje
  // (sem o resultado/XP do dia); ao terminar (completeReveal) passam a incluir hoje.
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
    completeReveal,
    confirm,
    justConfirmed,
  }
}
