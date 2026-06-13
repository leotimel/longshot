// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

describe('Onboarding', () => {
  it('mostra a regra em duas frases e o exemplo de selos; "Entendi" fecha', async () => {
    const onClose = vi.fn()
    render(<Onboarding onClose={onClose} />)

    expect(screen.getByText(/escolha seu quinteto/i)).toBeInTheDocument()
    expect(screen.getByText(/maiores times da história/i)).toBeInTheDocument()
    // exemplo visual do bracket (selos)
    expect(screen.getByText('🏆')).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: /entendi/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
