import { describe, it, expect } from 'vitest'
import { playerById } from '../engine/data/rosters'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import type { SeriesResult } from '../engine/types'
import { bestRating, isPerfectRun, overall, campaignStats } from './playerStats'

const wonSeries = (gamesLost: number): SeriesResult => ({
  winner: 'player',
  games: [],
  gamesWon: 4,
  gamesLost,
})

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

    // saldo / aproveitamento / maior vitória
    const expectedAgainst = bracket.rounds.reduce(
      (s, r) => s + r.games.reduce((g, gm) => g + gm.awayScore, 0),
      0,
    )
    expect(camp.pointsAgainst).toBe(expectedAgainst)
    expect(camp.gamesWon).toBeGreaterThanOrEqual(0)
    expect(camp.gamesWon).toBeLessThanOrEqual(camp.totalGames)
    expect(camp.biggestWin).toBeGreaterThanOrEqual(0)
  })
})

describe('isPerfectRun (16-0)', () => {
  it('campeão sem derrotas = invicto', () => {
    const rounds = [wonSeries(0), wonSeries(0), wonSeries(0), wonSeries(0)]
    expect(isPerfectRun({ champion: true, rounds })).toBe(true)
  })
  it('campeão com alguma derrota não é invicto', () => {
    const rounds = [wonSeries(0), wonSeries(2), wonSeries(0), wonSeries(0)]
    expect(isPerfectRun({ champion: true, rounds })).toBe(false)
  })
  it('não-campeão nunca é invicto', () => {
    expect(isPerfectRun({ champion: false, rounds: [wonSeries(0)] })).toBe(false)
  })
})

describe('bestRating', () => {
  it('devolve o atributo de maior valor do jogador', () => {
    const curry = playerById('warriors-2016-curry')! // 3pt é o forte
    expect(bestRating(curry).key).toBe('threePoint')
    expect(bestRating(curry).value).toBe(Math.max(...Object.values(curry.ratings)))
  })
})
