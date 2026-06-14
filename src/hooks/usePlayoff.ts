import { useCallback, useMemo, useState } from 'react'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import { playerById } from '../engine/data/rosters'
import type { BracketResult, Player } from '../engine/types'
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

  const bracket = useMemo<BracketResult | null>(() => {
    if (!day) return null
    const team = day.team
      .map((id) => playerById(id))
      .filter((p): p is Player => p !== undefined)
    if (team.length !== day.team.length) return null
    return simulateBracket(team, date)
  }, [day, date])

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
      setStats(confirmDay(record))
      setDay(record)
      setJustConfirmed(true)
    },
    [date],
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
