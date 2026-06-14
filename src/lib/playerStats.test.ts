import { describe, it, expect } from 'vitest'
import { playerById } from '../engine/data/rosters'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import { overall, campaignStats } from './playerStats'

describe('overall (índice de craque)', () => {
  it('coloca craques acima de 90 e mantém tudo em 40–99', () => {
    const legends = [
      'bulls-1996-jordan',
      'warriors-2016-curry',
      'bucks-1971-kareem',
      'knicks-1970-frazier',
      'blazers-1977-walton',
      'celtics-1964-russell',
      'lakers-2020-lebron',
    ]
    for (const id of legends) {
      const p = playerById(id)
      expect(p, id).toBeDefined()
      const ovr = overall(p!)
      expect(ovr, id).toBeGreaterThanOrEqual(90)
      expect(ovr, id).toBeLessThanOrEqual(99)
    }
  })

  it('reservas ficam claramente abaixo dos craques', () => {
    const bench = playerById('bulls-1996-longley')!
    const ovr = overall(bench)
    expect(ovr).toBeLessThan(75)
    expect(ovr).toBeGreaterThanOrEqual(40)
  })
})

describe('campaignStats', () => {
  it('soma os pontos do box, conta jogos e elege o MVP do quinteto', () => {
    const date = '2026-06-14'
    const draft = dailyDraft(date)
    const team = draft.draftTeams[0].roster
    const bracket = simulateBracket(team, date)
    const camp = campaignStats(bracket)

    const expectedPoints = bracket.rounds.reduce(
      (s, r) => s + r.games.reduce((g, gm) => g + gm.homeScore, 0),
      0,
    )
    const expectedGames = bracket.rounds.reduce((s, r) => s + r.games.length, 0)

    expect(camp.totalPoints).toBe(expectedPoints)
    expect(camp.totalGames).toBe(expectedGames)
    expect(camp.byPlayer.size).toBe(team.length)
    expect(team.some((p) => p.id === camp.mvpId)).toBe(true)
    expect(camp.recordGame).not.toBeNull()
  })
})
