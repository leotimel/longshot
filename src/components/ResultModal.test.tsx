// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultModal } from './ResultModal'
import type { DayRecord, Stats } from '../lib/storage'

const stats: Stats = { streak: 3, bestStreak: 5, badges: [2, 1, 0, 1], freezes: 0, history: {} }
const day: DayRecord = {
  date: '2026-06-13',
  team: ['a', 'b', 'c', 'd', 'e'],
  finalRound: 2,
  champion: false,
  badge: 1,
}

describe('ResultModal', () => {
  it('mostra o selo do dia, streak, coleção e contador; "Ver Bracket" fecha', async () => {
    const onClose = vi.fn()
    render(<ResultModal stats={stats} day={day} onShare={() => {}} onClose={onClose} />)

    expect(screen.getByText(/conference semis/i)).toBeInTheDocument()
    expect(screen.getByText(/🔥 3/)).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument() // 🥉 acumulado
    expect(screen.getByText(/próximo draft/i)).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: /ver bracket/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('sem o dia: só stats, botão "Fechar" e sem "Compartilhar"', () => {
    render(<ResultModal stats={stats} onClose={() => {}} />)
    expect(screen.queryByText(/conference semis/i)).toBeNull()
    expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /compartilhar/i })).toBeNull()
  })
})
