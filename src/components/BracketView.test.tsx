// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import { BracketView } from './BracketView'

const date = '2026-06-13'
const draft = dailyDraft(date)
const team = draft.draftTeams[0].roster
const bracket = simulateBracket(team, date)

describe('BracketView (gradual)', () => {
  it('começa com rounds futuros ocultos e revela ao "Simular round"; ao fim chama onPlayoffEnd', async () => {
    const onEnd = vi.fn()
    render(<BracketView bracket={bracket} opponents={draft.bracket} gradual onPlayoffEnd={onEnd} />)

    expect(screen.getByRole('button', { name: /simular round/i })).toBeInTheDocument()
    expect(screen.getAllByText('🔒').length).toBe(3)

    const user = userEvent.setup()
    for (let i = 0; i < bracket.rounds.length; i++) {
      await user.click(screen.getByRole('button', { name: /simular round/i }))
    }
    expect(onEnd).toHaveBeenCalled()
  })

  it('"partida por partida" abre a tela de jogo (sem spoilar o total) e "acelerar pro fim" conclui', async () => {
    render(<BracketView bracket={bracket} opponents={draft.bracket} gradual />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /partida por partida/i }))
    expect(screen.getByText(/jogo 1/i)).toBeInTheDocument()
    // Não revela o total de jogos da série (spoiler).
    expect(screen.queryByText(/jogo 1 de/i)).toBeNull()

    await user.click(screen.getByRole('button', { name: /acelerar pro fim/i }))
    expect(screen.getByText(/seu playoff/i)).toBeInTheDocument()
  })
})
