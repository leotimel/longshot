// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { POSITIONS, type Player } from '../engine/types'
import { dailyDraft } from '../engine/draft'
import { DraftScreen } from './DraftScreen'

describe('DraftScreen (draft por time)', () => {
  it('escolhe 1 jogador por time, trava posições e inicia com 5 jogadores', async () => {
    const draft = dailyDraft('2026-06-13')
    const onStart = vi.fn()
    render(<DraftScreen draft={draft} onStartPlayoff={onStart} />)

    expect(screen.queryByRole('button', { name: /iniciar playoff/i })).toBeNull()

    const user = userEvent.setup()
    const pickedIds: string[] = []
    // No passo i, o time atual é draftTeams[i]; escolho o jogador da posição i.
    for (let i = 0; i < POSITIONS.length; i++) {
      const player = draft.draftTeams[i].roster.find((p) => p.position === POSITIONS[i])
      expect(player, POSITIONS[i]).toBeDefined()
      pickedIds.push(player!.id)
      await user.click(screen.getByRole('button', { name: new RegExp(player!.name, 'i') }))
    }

    await user.click(screen.getByRole('button', { name: /iniciar playoff/i }))
    expect(onStart).toHaveBeenCalledTimes(1)
    const team: Player[] = onStart.mock.calls[0][0]
    expect(team).toHaveLength(5)
    expect(team.map((p) => p.position)).toEqual([...POSITIONS])
    expect(team.map((p) => p.id)).toEqual(pickedIds)
  })
})
