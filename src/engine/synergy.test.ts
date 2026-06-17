import { describe, it, expect } from 'vitest'
import { ROSTERS } from './data/rosters'
import { synergyAdjust, synergyOf } from './synergy'

describe('synergy (coesão de era)', () => {
  it('quinteto de uma era só → coesão total + bônus', () => {
    const team = ROSTERS['bulls-1996'] // todos 1990s
    const s = synergyOf(team)
    expect(s.era).toBe('1990s')
    expect(s.count).toBe(5)
    const adj = synergyAdjust(team)
    expect(adj?.clutch).toBeGreaterThan(0)
    expect(adj?.make).toBeGreaterThan(0)
  })

  it('eras variadas (<3 iguais) → sem bônus', () => {
    const mixed = [
      ROSTERS['celtics-1964'][0], // 1960s
      ROSTERS['lakers-1985'][0], // 1980s
      ROSTERS['bulls-1996'][0], // 1990s
      ROSTERS['lakers-2000'][0], // 2000s
      ROSTERS['warriors-2016'][0], // 2010s
    ]
    expect(synergyOf(mixed).count).toBe(1)
    expect(synergyAdjust(mixed)).toBeUndefined()
  })
})
