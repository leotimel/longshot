import { describe, it, expect } from 'vitest'
import { factFor, knownFactNames } from './playerFacts'
import { ROSTERS } from '../engine/data/rosters'

const rosterNames = new Set(Object.values(ROSTERS).flat().map((p) => p.name))

describe('playerFacts', () => {
  it('traz curiosidade de uma lenda e nada de quem não tem', () => {
    expect(factFor('Michael Jordan')).toMatch(/título/i)
    expect(factFor('Fulano Inexistente')).toBeUndefined()
  })

  it('TODA chave de fato corresponde a um jogador real de algum elenco', () => {
    const orphans = knownFactNames().filter((n) => !rosterNames.has(n))
    expect(orphans).toEqual([])
  })

  it('as lendas recém-adicionadas têm time e curiosidade', () => {
    for (const n of ['Allen Iverson', 'Tracy McGrady', 'Yao Ming', 'Damian Lillard', 'Jimmy Butler']) {
      expect(rosterNames.has(n)).toBe(true)
      expect(factFor(n)).toBeTruthy()
    }
  })
})
