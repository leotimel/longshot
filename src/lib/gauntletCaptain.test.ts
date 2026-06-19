import { describe, it, expect } from 'vitest'
import { ROSTERS } from '../engine/data/rosters'
import { CAPTAIN_CHALLENGES, captainPerks, isChallengeDone } from './gauntletCaptain'
import type { CaptainState } from './storage'

const base = ROSTERS['bulls-1996'][0]
const fresh: CaptainState = { id: base.id, roundsWith: 0, bossWins: 0, bestGame: 0, bestRound: 0 }

describe('gauntletCaptain', () => {
  it('sem desafios: jogador base, sem perks', () => {
    const p = captainPerks(fresh)
    expect(p.player?.id).toBe(base.id)
    expect(p.startShields).toBe(0)
    expect(p.boost.make ?? 0).toBe(0)
    expect(CAPTAIN_CHALLENGES.every((ch) => !isChallengeDone(ch, fresh))).toBe(true)
  })

  it('boosts permanentes ao cumprir os desafios', () => {
    const maxed: CaptainState = { id: base.id, roundsWith: 10, bossWins: 3, bestGame: 50, bestRound: 20 }
    const p = captainPerks(maxed)
    expect(p.player!.ratings.speed).toBe(Math.min(99, base.ratings.speed + 5)) // veterano(+2)+lenda(+3)
    expect(p.startShields).toBe(1) // matador
    expect(p.boost.make).toBeGreaterThan(0) // astro
    expect(CAPTAIN_CHALLENGES.every((ch) => isChallengeDone(ch, maxed))).toBe(true)
  })
})
