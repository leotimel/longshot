import { describe, it, expect } from 'vitest'
import { POSITIONS } from './types'
import { dailyDraft } from './draft'

const poolIds = (d: ReturnType<typeof dailyDraft>) =>
  d.playerPool.flat().map((p) => p.id)
const bracketIds = (d: ReturnType<typeof dailyDraft>) => d.bracket.map((t) => t.id)
const strength = (t: { teamRatings: { offense: number; defense: number; clutch: number } }) =>
  t.teamRatings.offense + t.teamRatings.defense + t.teamRatings.clutch

describe('dailyDraft', () => {
  it('mesmo dia → mesmos 10 jogadores e mesmos 4 adversários', () => {
    const a = dailyDraft('2026-06-11')
    const b = dailyDraft('2026-06-11')
    expect(a).toEqual(b)
  })

  it('dias diferentes → pools e brackets diferentes', () => {
    const a = dailyDraft('2026-06-11')
    const b = dailyDraft('2026-06-12')
    expect(poolIds(a)).not.toEqual(poolIds(b))
    expect(bracketIds(a)).not.toEqual(bracketIds(b))
  })

  it('os 4 adversários são sempre distintos', () => {
    for (let day = 1; day <= 30; day++) {
      const date = `2026-06-${String(day).padStart(2, '0')}`
      const ids = bracketIds(dailyDraft(date))
      expect(new Set(ids).size).toBe(4)
    }
  })

  it('o pool tem 2 jogadores por posição (10 distintos, na ordem de POSITIONS)', () => {
    const d = dailyDraft('2026-06-11')
    expect(d.playerPool).toHaveLength(POSITIONS.length)
    d.playerPool.forEach((pair, i) => {
      expect(pair).toHaveLength(2)
      for (const player of pair) {
        expect(player.position).toBe(POSITIONS[i])
      }
    })
    expect(new Set(poolIds(d)).size).toBe(10)
  })

  it('o bracket está em escalada crescente de força (First Round → Finals)', () => {
    for (let day = 1; day <= 30; day++) {
      const date = `2026-06-${String(day).padStart(2, '0')}`
      const { bracket } = dailyDraft(date)
      for (let i = 1; i < bracket.length; i++) {
        expect(strength(bracket[i])).toBeGreaterThanOrEqual(strength(bracket[i - 1]))
      }
    }
  })
})
