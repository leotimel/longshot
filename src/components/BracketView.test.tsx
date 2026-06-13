// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import { BracketView } from './BracketView'

const date = '2026-06-13'
const draft = dailyDraft(date)
const team = draft.playerPool.map((opts) => opts[0])
const picks = [0, 0, 0, 0, 0]
const bracket = simulateBracket(team, date, picks)

describe('BracketView (gradual)', () => {
  it('começa com rounds futuros ocultos e revela ao "Simular round"; ao fim chama onPlayoffEnd', async () => {
    const onEnd = vi.fn()
    render(<BracketView bracket={bracket} opponents={draft.bracket} gradual onPlayoffEnd={onEnd} />)

    // O First Round é o "a jogar"; os demais rounds ficam bloqueados (🔒).
    expect(screen.getByRole('button', { name: /simular round/i })).toBeInTheDocument()
    expect(screen.getAllByText('🔒').length).toBe(3)

    const user = userEvent.setup()
    // Simula round a round até o bracket terminar.
    for (let i = 0; i < bracket.rounds.length; i++) {
      await user.click(screen.getByRole('button', { name: /simular round/i }))
    }
    expect(onEnd).toHaveBeenCalled()
  })

  it('"partida por partida" abre a tela de jogo e "acelerar pro fim" conclui o round', async () => {
    render(<BracketView bracket={bracket} opponents={draft.bracket} gradual />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /partida por partida/i }))
    expect(screen.getByText(/jogo 1 de/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /acelerar pro fim/i }))
    expect(screen.getByText(/seu playoff/i)).toBeInTheDocument()
  })
})
