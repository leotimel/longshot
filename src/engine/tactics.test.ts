import { describe, it, expect } from 'vitest'
import { ROSTERS } from './data/rosters'
import { dailyDraft } from './draft'
import { simulateBracket } from './bracket'
import { simulateSeries } from './series'
import { adjustForGame, SCHEME_ADJUST } from './tactics'

const date = '2026-06-14'
const team = ROSTERS['bulls-1996']
const opp = dailyDraft(date).bracket[0]
const sixth = ROSTERS['lakers-2000'][1] // um SG reserva

describe('adjustForGame', () => {
  it('retorna undefined quando nada se aplica', () => {
    expect(adjustForGame(undefined, 1, team)).toBeUndefined()
    expect(adjustForGame({}, 1, team)).toBeUndefined()
    expect(adjustForGame({ timeoutFromGame: 3 }, 2, team)).toBeUndefined() // jogo 2 < 3
  })

  it('esquema aplica os deltas (trade-off)', () => {
    const a = adjustForGame({ scheme: 'acelerar' }, 1, team)
    expect(a).toMatchObject({ pace: SCHEME_ADJUST.acelerar.pace, defense: SCHEME_ADJUST.acelerar.defense })
  })

  it('timeout vale do jogo gatilho em diante', () => {
    expect(adjustForGame({ timeoutFromGame: 3 }, 3, team)).toBeDefined()
    expect(adjustForGame({ timeoutFromGame: 3 }, 4, team)).toBeDefined()
  })

  it('takeover foca o craque só no jogo escolhido', () => {
    const a = adjustForGame({ takeoverGame: 2 }, 2, team)
    expect(a?.focusId).toBeTruthy()
    expect(a?.focusBoost).toBeGreaterThan(1)
    expect(adjustForGame({ takeoverGame: 2 }, 3, team)).toBeUndefined()
  })

  it('sexto homem troca o quinteto a partir do jogo gatilho', () => {
    const a = adjustForGame({ sixthManFromGame: 1 }, 1, team, sixth)
    expect(a?.lineup?.some((p) => p.id === sixth.id)).toBe(true)
  })
})

describe('baseline preservado (sem táticas)', () => {
  it('série sem táticas == série com táticas vazias', () => {
    const seed = 12345
    const base = simulateSeries(team, opp, seed)
    const empty = simulateSeries(team, opp, seed, {}, undefined)
    expect(empty).toEqual(base)
  })
})

describe('determinismo com táticas', () => {
  it('mesmas táticas → mesmo resultado', () => {
    const t = { 0: { scheme: 'travar' as const, timeoutFromGame: 2 } }
    const a = simulateBracket(team, date, t)
    const b = simulateBracket(team, date, t)
    expect(a).toEqual(b)
  })

  it('uma tática muda a série em relação ao baseline', () => {
    const seed = 999
    const base = simulateSeries(team, opp, seed)
    const tweaked = simulateSeries(team, opp, seed, { scheme: 'isolar', timeoutFromGame: 1 })
    // o placar de pelo menos um jogo deve diferir
    const changed = tweaked.games.some(
      (g, i) => base.games[i] === undefined || g.homeScore !== base.games[i].homeScore,
    )
    expect(changed).toBe(true)
  })
})
