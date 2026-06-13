// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dailyDraft } from '../engine/draft'
import { DraftScreen } from './DraftScreen'

describe('DraftScreen', () => {
  it('escolhe posição a posição (3 opções) e só então revela Iniciar Playoff', async () => {
    const draft = dailyDraft('2026-06-13')
    const onStart = vi.fn()
    render(<DraftScreen draft={draft} onStartPlayoff={onStart} />)

    // Antes de fechar os 5, o botão não existe.
    expect(screen.queryByRole('button', { name: /iniciar playoff/i })).toBeNull()

    const user = userEvent.setup()
    // Em cada posição (uma por vez), escolhe a 1ª das 3 opções.
    for (let i = 0; i < 5; i++) {
      const firstOption = draft.playerPool[i][0]
      await user.click(screen.getByRole('button', { name: new RegExp(firstOption.name, 'i') }))
    }

    const startBtn = screen.getByRole('button', { name: /iniciar playoff/i })
    await user.click(startBtn)

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart.mock.calls[0][0]).toEqual([0, 0, 0, 0, 0])
  })
})
