import { describe, it, expect } from 'vitest'
import { factFor } from './playerFacts'
import { ROSTERS } from '../engine/data/rosters'

describe('playerFacts', () => {
  it('traz curiosidade de uma lenda e nada de quem não tem', () => {
    expect(factFor('Michael Jordan')).toMatch(/título/i)
    expect(factFor('Fulano Inexistente')).toBeUndefined()
  })

  it('toda chave de fato corresponde a um jogador real de algum elenco', () => {
    const names = new Set(Object.values(ROSTERS).flat().map((p) => p.name))
    const sample = ['Michael Jordan', 'Stephen Curry', 'Nikola Jokić', "Shaquille O'Neal", 'Marc Gasol']
    for (const n of sample) {
      expect(names.has(n)).toBe(true)
      expect(factFor(n)).toBeTruthy()
    }
  })
})
