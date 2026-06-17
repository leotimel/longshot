import { describe, it, expect } from 'vitest'
import type { GameAdjust, Player } from '../engine/types'
import { POSITIONS } from '../engine/types'
import { ROSTERS } from '../engine/data/rosters'
import { simulateGauntletRound } from '../engine/endless'
import { overall } from './playerStats'
import { BOON_CAPS, boonById, boonEffective, initBuild, offerBoons } from './gauntletBoons'

const team = ROSTERS['bulls-1996']

// "Pior caso" de build maxado: o melhor-5 do jogo (endgame do Reforço) + boost no teto.
const allPlayers = Object.values(ROSTERS).flat()
const best5: Player[] = POSITIONS.map((pos) =>
  allPlayers.filter((p) => p.position === pos).reduce((b, p) => (overall(p) > overall(b) ? p : b)),
)
const maxedBoost: GameAdjust = { ...BOON_CAPS }
const winRate = (round: number, n = 60): number => {
  let wins = 0
  for (let s = 0; s < n; s++) {
    if (simulateGauntletRound(best5, s * 13 + 1, round, maxedBoost).winner === 'player') wins += 1
  }
  return wins / n
}

describe('gauntletBoons', () => {
  it('offerBoons: até 3 efetivos, distintos e determinístico', () => {
    const s = initBuild(team)
    const a = offerBoons(7, 2, s, [])
    expect(a.length).toBeGreaterThan(0)
    expect(a.length).toBeLessThanOrEqual(3)
    expect(new Set(a.map((b) => b.id)).size).toBe(a.length)
    expect(offerBoons(7, 2, s, []).map((b) => b.id)).toEqual(a.map((b) => b.id))
  })

  it('boon de rating soma ao boost (até o teto)', () => {
    const garra = boonById('garra')!
    expect(garra.apply(initBuild(team), []).boost.clutch).toBeGreaterThan(0)
  })

  it('atributo no teto: boon para de fazer efeito e sai da oferta', () => {
    let s = initBuild(team)
    const garra = boonById('garra')!
    for (let i = 0; i < 10; i++) s = garra.apply(s, [])
    expect(s.boost.clutch).toBe(BOON_CAPS.clutch)
    expect(boonEffective(garra, s, [])).toBe(false)
  })

  it('Fôlego dá escudo, com teto', () => {
    const folego = boonById('folego')!
    let s = initBuild(team)
    for (let i = 0; i < 10; i++) s = folego.apply(s, [])
    expect(s.shields).toBe(3)
    expect(boonEffective(folego, s, [])).toBe(false)
  })

  it('Reforço troca o elo fraco por um craque da mesma posição', () => {
    const base = initBuild(team)
    const pool = Object.values(ROSTERS).flat()
    const next = boonById('reforco')!.apply(base, pool)
    expect(next.team).toHaveLength(5)
    expect(next.team.map((p) => p.position)).toEqual(base.team.map((p) => p.position))
    expect(next.team.some((p, i) => p.id !== base.team[i].id)).toBe(true)
  })

  it('platô: até o build maxado é desafiado (toda run acaba)', () => {
    // Melhor-5 + boost no teto vs adversários do platô (99/99/99): começo confortável,
    // paredão depois (bem abaixo de 1 → a run sempre termina).
    expect(winRate(30)).toBeGreaterThan(0.7) // ramp justo no começo
    expect(winRate(60)).toBeLessThan(0.85) // platô é desafio real, não vitória garantida
  })
})
