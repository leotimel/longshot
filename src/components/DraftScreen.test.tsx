// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dailyDraft } from '../engine/draft'
import { DraftScreen } from './DraftScreen'

describe('DraftScreen', () => {
  it('só revela "Iniciar Playoff" após escolher os 5 e dispara onStartPlayoff', async () => {
    const draft = dailyDraft('2026-06-13')
    const onStart = vi.fn()
    render(<DraftScreen draft={draft} onStartPlayoff={onStart} />)

    // Antes de escolher, o botão não existe.
    expect(screen.queryByRole('button', { name: /iniciar playoff/i })).toBeNull()

    const user = userEvent.setup()
    // Escolhe o 1º jogador de cada posição.
    for (const player of draft.playerPool.map((pair) => pair[0])) {
      await user.click(screen.getByRole('button', { name: new RegExp(player.name, 'i') }))
    }

    const startBtn = screen.getByRole('button', { name: /iniciar playoff/i })
    await user.click(startBtn)

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart.mock.calls[0][0]).toHaveLength(5)
    // 1º de cada dupla = índice 0.
    expect(onStart.mock.calls[0][0]).toEqual([0, 0, 0, 0, 0])
  })
})
