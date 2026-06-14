import { describe, it, expect } from 'vitest'
import { POSITIONS } from './types'
import { TEAMS } from './data/teams'
import { dailyDraft } from './draft'

const teamOrder = (d: ReturnType<typeof dailyDraft>) => d.draftTeams.map((t) => t.id)
const bracketIds = (d: ReturnType<typeof dailyDraft>) => d.bracket.map((t) => t.id)
const strength = (t: { teamRatings: { offense: number; defense: number; clutch: number } }) =>
  t.teamRatings.offense + t.teamRatings.defense + t.teamRatings.clutch

describe('dailyDraft', () => {
  it('mesma data + mesmo salt → mesmo sorteio', () => {
    expect(dailyDraft('2026-06-11', 'abc')).toEqual(dailyDraft('2026-06-11', 'abc'))
  })

  it('salts diferentes → ordem de times diferente, mas os MESMOS adversários', () => {
    const a = dailyDraft('2026-06-11', 'jogador-1')
    const b = dailyDraft('2026-06-11', 'jogador-2')
    expect(teamOrder(a)).not.toEqual(teamOrder(b))
    expect(bracketIds(a)).toEqual(bracketIds(b)) // advs pela data
  })

  it('dias diferentes → brackets diferentes', () => {
    expect(bracketIds(dailyDraft('2026-06-11'))).not.toEqual(bracketIds(dailyDraft('2026-06-12')))
  })

  it('a sequência traz todos os times draftáveis, cada um com 5 do elenco', () => {
    const d = dailyDraft('2026-06-11')
    expect(d.draftTeams.length).toBe(TEAMS.length)
    for (const dt of d.draftTeams) {
      expect(dt.roster).toHaveLength(5)
      expect(dt.roster.map((p) => p.position).sort()).toEqual([...POSITIONS].sort())
    }
  })

  it('os 4 adversários são distintos e em escalada crescente de força', () => {
    for (let day = 1; day <= 30; day++) {
      const { bracket } = dailyDraft(`2026-06-${String(day).padStart(2, '0')}`)
      expect(new Set(bracket.map((t) => t.id)).size).toBe(4)
      for (let i = 1; i < bracket.length; i++) {
        expect(strength(bracket[i])).toBeGreaterThanOrEqual(strength(bracket[i - 1]))
      }
    }
  })
})
