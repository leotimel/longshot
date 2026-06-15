// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { POSITIONS, type Player } from '../engine/types'
import { dailyDraft } from '../engine/draft'
import { DraftScreen } from './DraftScreen'

/** Escolhe 1 jogador por posição (passos 0..4) e devolve os ids escolhidos. */
async function pickFive(draft: ReturnType<typeof dailyDraft>) {
  const user = userEvent.setup()
  const pickedIds: string[] = []
  for (let i = 0; i < POSITIONS.length; i++) {
    const player = draft.draftTeams[i].roster.find((p) => p.position === POSITIONS[i])
    expect(player, POSITIONS[i]).toBeDefined()
    pickedIds.push(player!.id)
    await user.click(screen.getByRole('button', { name: new RegExp(player!.name, 'i') }))
  }
  return { user, pickedIds }
}

describe('DraftScreen (draft por time)', () => {
  it('escolhe 1 jogador por time, pula o sexto homem e inicia com 5 jogadores', async () => {
    const draft = dailyDraft('2026-06-13')
    const onStart = vi.fn()
    render(<DraftScreen draft={draft} onStartPlayoff={onStart} />)

    expect(screen.queryByRole('button', { name: /iniciar playoff/i })).toBeNull()

    const { user, pickedIds } = await pickFive(draft)

    // Passo do sexto homem aparece; pular leva ao botão de iniciar.
    await user.click(screen.getByRole('button', { name: /pular/i }))
    await user.click(screen.getByRole('button', { name: /iniciar playoff/i }))

    expect(onStart).toHaveBeenCalledTimes(1)
    const team: Player[] = onStart.mock.calls[0][0]
    expect(team).toHaveLength(5)
    expect(team.map((p) => p.position)).toEqual([...POSITIONS])
    expect(team.map((p) => p.id)).toEqual(pickedIds)
    expect(onStart.mock.calls[0][1]).toBeUndefined() // sem sexto homem
  })

  it('escolher um sexto homem passa o id como 2º argumento', async () => {
    const draft = dailyDraft('2026-06-13')
    const onStart = vi.fn()
    render(<DraftScreen draft={draft} onStartPlayoff={onStart} />)

    const { user } = await pickFive(draft)

    const sixth = draft.draftTeams[POSITIONS.length].roster[0]
    await user.click(screen.getByRole('button', { name: new RegExp(sixth.name, 'i') }))
    await user.click(screen.getByRole('button', { name: /iniciar playoff/i }))

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart.mock.calls[0][1]).toBe(sixth.id)
  })
})
