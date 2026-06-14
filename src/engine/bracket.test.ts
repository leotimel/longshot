import { describe, it, expect } from 'vitest'
import { POSITIONS, type Player } from './types'
import { dailyDraft } from './draft'
import { simulateBracket } from './bracket'

/** Time sintético uniforme (todos os ratings = `rating`). */
function uniformTeam(rating: number): Player[] {
  return POSITIONS.map((pos) => ({
    id: `test-${pos}-${rating}`,
    name: `Test ${pos}`,
    position: pos,
    era: '2020s' as const,
    ratings: {
      speed: rating,
      shooting: rating,
      threePoint: rating,
      defense: rating,
      passing: rating,
      rebounding: rating,
      clutch: rating,
    },
  }))
}

const greats = uniformTeam(82)
const godTeam = uniformTeam(99)
const scrubs = uniformTeam(12)

// Datas-amostra (strings opacas para o engine; não são parseadas como Date).
const dates: string[] = []
for (const month of ['06', '07']) {
  for (let d = 1; d <= 28; d++) dates.push(`2026-${month}-${String(d).padStart(2, '0')}`)
}

describe('simulateBracket', () => {
  it('mesmo time (e data) = mesmo bracket result', () => {
    expect(simulateBracket(greats, '2026-06-12')).toEqual(simulateBracket(greats, '2026-06-12'))
  })

  it('invariantes: 1–4 rodadas, derrota só na última, champion sse venceu as 4', () => {
    for (const date of dates) {
      const r = simulateBracket(greats, date)
      expect(r.rounds.length).toBeGreaterThanOrEqual(1)
      expect(r.rounds.length).toBeLessThanOrEqual(4)

      // Uma derrota encerra o bracket: só a última rodada pode ter sido perdida.
      r.rounds.forEach((series, i) => {
        if (i < r.rounds.length - 1) expect(series.winner).toBe('player')
      })

      if (r.rounds.length < 4) {
        expect(r.rounds[r.rounds.length - 1].winner).toBe('opponent')
        expect(r.champion).toBe(false)
      } else {
        expect(r.champion).toBe(r.rounds[3].winner === 'player')
      }

      // Adversários do dia nunca se repetem (4 distintos).
      const ids = dailyDraft(date).bracket.map((t) => t.id)
      expect(new Set(ids).size).toBe(4)
    }
  })

  it('quem perde no First Round termina com 1 rodada (e nunca é campeão)', () => {
    const lengths = dates.map((d) => simulateBracket(scrubs, d).rounds.length)
    expect(lengths).toContain(1)
    expect(dates.every((d) => !simulateBracket(scrubs, d).champion)).toBe(true)
  })

  it('quem ganha tudo termina com 4 rodadas e é campeão', () => {
    const results = dates.map((d) => simulateBracket(godTeam, d))
    expect(results.some((r) => r.rounds.length === 4 && r.champion)).toBe(true)
  })
})
