// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { GameFeed } from './GameFeed'
import type { GameResult } from '../engine/types'

const game: GameResult = {
  homeScore: 104,
  awayScore: 99,
  playByPlay: ['Q4 · Curry crava de 3'],
  boxScore: [
    { playerId: 'a', name: 'Stephen Curry', points: 40 },
    { playerId: 'b', name: 'LeBron James', points: 30 },
  ],
}

describe('GameFeed', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('revela o placar só após a suspense', () => {
    render(
      <GameFeed
        game={game}
        opponentName="Chicago Bulls"
        gameNumber={1}
        totalGames={4}
        onBackToSeries={() => {}}
      />,
    )

    // Durante a suspense o placar fica escondido.
    expect(screen.queryByText('104')).toBeNull()

    // Passado o delay, o placar é revelado.
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByText('104')).toBeInTheDocument()
    expect(screen.getByText('99')).toBeInTheDocument()
  })
})
