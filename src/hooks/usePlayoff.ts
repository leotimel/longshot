import { useCallback, useMemo, useState } from 'react'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import type { BracketResult } from '../engine/types'
import { confirmDay, getDay, loadStats, type DayRecord, type Stats } from '../lib/storage'

/**
 * Orquestra o dia: carrega o draft, sabe se já foi confirmado (→ direto ao
 * bracket), trava os picks ao confirmar, roda o motor e salva resultado + selo.
 *
 * O bracket é recomputado de forma determinística a partir dos picks salvos —
 * nada de simulação é persistido.
 */
export function usePlayoff(date: string) {
  const draft = useMemo(() => dailyDraft(date), [date])
  const [day, setDay] = useState<DayRecord | undefined>(() => getDay(date))
  const [stats, setStats] = useState<Stats>(() => loadStats())

  const bracket = useMemo<BracketResult | null>(() => {
    if (!day) return null
    const team = draft.playerPool.map((pair, i) => pair[day.picks[i]])
    return simulateBracket(team, date, day.picks)
  }, [day, draft, date])

  const confirm = useCallback(
    (picks: number[]) => {
      if (getDay(date)) return // já travado: não permite refazer
      const team = draft.playerPool.map((pair, i) => pair[picks[i]])
      const result = simulateBracket(team, date, picks)
      const roundsWon = result.rounds.filter((r) => r.winner === 'player').length
      const record: DayRecord = {
        date,
        picks,
        finalRound: result.rounds.length,
        champion: result.champion,
        badge: roundsWon > 0 ? roundsWon - 1 : null,
      }
      setStats(confirmDay(record))
      setDay(record)
    },
    [date, draft],
  )

  return { draft, locked: day !== undefined, day, bracket, stats, confirm }
}
