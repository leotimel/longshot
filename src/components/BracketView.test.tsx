// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dailyDraft } from '../engine/draft'
import { simulateBracket } from '../engine/bracket'
import { BracketView } from './BracketView'

describe('BracketView', () => {
  it('navega bracket → série → jogo, avança e volta ao resumo', async () => {
    const date = '2026-06-13'
    const draft = dailyDraft(date)
    const picks = [0, 0, 0, 0, 0]
    const team = draft.playerPool.map((pair) => pair[0])
    const bracket = simulateBracket(team, date, picks)

    render(<BracketView bracket={bracket} opponents={draft.bracket} />)
    expect(screen.getByText(/seu playoff/i)).toBeInTheDocument()

    const user = userEvent.setup()
    // 4 botões de rodada (sem onExit). O 1º é o First Round (sempre jogado).
    await user.click(screen.getAllByRole('button')[0])

    // Resumo da série → abre o Jogo 1.
    await user.click(screen.getByRole('button', { name: /jogo 1/i }))

    // GameFeed: cabeçalho, box score e play-by-play.
    expect(screen.getByText(/jogo 1 de/i)).toBeInTheDocument()
    expect(screen.getByText(/box score/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Q[1-4]/).length).toBeGreaterThan(0)

    // "Próximo Jogo" avança (série do First Round tem ≥4 jogos).
    await user.click(screen.getByRole('button', { name: /próximo jogo/i }))
    expect(screen.getByText(/jogo 2 de/i)).toBeInTheDocument()

    // "Ver Série" volta ao resumo (a lista de jogos reaparece).
    await user.click(screen.getByRole('button', { name: /ver série/i }))
    expect(screen.getByRole('button', { name: /jogo 1/i })).toBeInTheDocument()
  })
})
