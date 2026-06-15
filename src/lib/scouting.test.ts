import { describe, it, expect } from 'vitest'
import { TEAMS } from '../engine/data/teams'
import { ROSTERS } from '../engine/data/rosters'
import { opponentTraits, teamTraits } from './scouting'

const team = (id: string) => TEAMS.find((t) => t.id === id)!
const labels = (id: string) => opponentTraits(team(id)).map((t) => t.label)

describe('opponentTraits', () => {
  it('Suns 2004-05 (run-and-gun): ritmo alto + defesa fraca', () => {
    const l = labels('suns-2005')
    expect(l).toContain('Ritmo alto')
    expect(l).toContain('Defesa fraca')
  })

  it('Pistons 2003-04 (grind defensivo): ritmo lento + defesa elite', () => {
    const l = labels('pistons-2004')
    expect(l).toContain('Ritmo lento')
    expect(l).toContain('Defesa elite')
  })

  it('Bulls 1995-96 (juggernaut): ataque e defesa elite', () => {
    const l = labels('bulls-1996')
    expect(l).toContain('Ataque elite')
    expect(l).toContain('Defesa elite')
  })

  it('times antigos têm pouca bola de 3', () => {
    expect(labels('celtics-1964')).toContain('Pouca bola de 3')
  })
})

describe('teamTraits', () => {
  it('aponta um craque dominante e devolve até 3 chips', () => {
    const traits = teamTraits(ROSTERS['bulls-1996']) // Jordan domina o overall
    expect(traits.length).toBeLessThanOrEqual(3)
    expect(traits.some((t) => t.label.startsWith('Craque:'))).toBe(true)
  })

  it('time vazio → sem traços', () => {
    expect(teamTraits([])).toEqual([])
  })
})
