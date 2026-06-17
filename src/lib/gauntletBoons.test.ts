import { describe, it, expect } from 'vitest'
import { ROSTERS } from '../engine/data/rosters'
import { boonById, initBuild, offerBoons } from './gauntletBoons'

const team = ROSTERS['bulls-1996']

describe('gauntletBoons', () => {
  it('offerBoons: 3 distintos e determinístico pela seed/rodada', () => {
    const a = offerBoons(7, 2)
    expect(a).toHaveLength(3)
    expect(new Set(a.map((b) => b.id)).size).toBe(3)
    expect(offerBoons(7, 2).map((b) => b.id)).toEqual(a.map((b) => b.id))
  })

  it('boon de rating soma ao boost da run', () => {
    const garra = boonById('garra')!
    expect(garra.apply(initBuild(team), []).boost.clutch).toBeGreaterThan(0)
  })

  it('Fôlego dá um escudo', () => {
    expect(boonById('folego')!.apply(initBuild(team), []).shields).toBe(1)
  })

  it('Reforço troca o elo fraco por um craque da mesma posição', () => {
    const base = initBuild(team)
    const pool = Object.values(ROSTERS).flat()
    const next = boonById('reforco')!.apply(base, pool)
    expect(next.team).toHaveLength(5)
    expect(next.team.map((p) => p.position)).toEqual(base.team.map((p) => p.position))
    expect(next.team.some((p, i) => p.id !== base.team[i].id)).toBe(true)
  })
})
