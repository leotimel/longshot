import { useCallback, useMemo, useState } from 'react'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import type { BracketResult } from '../engine/types'
import {
  confirmDay,
  getDay,
  getPlayerSeed,
  loadStats,
  type DayRecord,
  type Stats,
} from '../lib/storage'

/**
 * Orquestra o dia: carrega o draft (pool por jogador, adversários pela data),
 * sabe se já foi confirmado (→ direto ao bracket), trava os picks ao confirmar,
 * roda o motor e salva resultado + selo.
 *
 * O bracket é recomputado de forma determinística a partir do `poolSalt` e dos
 * picks salvos — nada de simulação é persistido.
 */
export function usePlayoff(date: string) {
  const playerSeed = useMemo(() => getPlayerSeed(), [])
  const draft = useMemo(() => dailyDraft(date, playerSeed), [date, playerSeed])
  const [day, setDay] = useState<DayRecord | undefined>(() => getDay(date))
  const [stats, setStats] = useState<Stats>(() => loadStats())
  // true só na sessão que acabou de confirmar → habilita revelação gradual.
  const [justConfirmed, setJustConfirmed] = useState(false)

  const bracket = useMemo<BracketResult | null>(() => {
    if (!day) return null
    const pool = dailyDraft(date, day.poolSalt ?? '').playerPool
    const team = pool.map((opts, i) => opts[day.picks[i]])
    return simulateBracket(team, date, day.picks)
  }, [day, date])

  const confirm = useCallback(
    (picks: number[]) => {
      if (getDay(date)) return // já travado: não permite refazer
      const team = draft.playerPool.map((opts, i) => opts[picks[i]])
      const result = simulateBracket(team, date, picks)
      const roundsWon = result.rounds.filter((r) => r.winner === 'player').length
      const record: DayRecord = {
        date,
        picks,
        finalRound: result.rounds.length,
        champion: result.champion,
        badge: roundsWon > 0 ? roundsWon - 1 : null,
        poolSalt: playerSeed,
      }
      setStats(confirmDay(record))
      setDay(record)
      setJustConfirmed(true)
    },
    [date, draft, playerSeed],
  )

  return {
    draft,
    locked: day !== undefined,
    day,
    bracket,
    stats,
    confirm,
    justConfirmed,
  }
}
