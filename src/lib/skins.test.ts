import { describe, it, expect } from 'vitest'
import { DEFAULT_SKIN, isSkinUnlocked, skinById } from './skins'
import { DEFAULT_FRAME, frameById, isFrameUnlocked } from './frames'

describe('skins', () => {
  it('hardwood é o default e sempre desbloqueado', () => {
    expect(DEFAULT_SKIN).toBe('hardwood')
    expect(isSkinUnlocked(skinById('hardwood'), 1)).toBe(true)
  })

  it('temas desbloqueiam no nível certo', () => {
    const clean = skinById('clean') // unlockLevel 12
    expect(isSkinUnlocked(clean, 11)).toBe(false)
    expect(isSkinUnlocked(clean, 12)).toBe(true)
  })

  it('skinById cai no default quando o id é desconhecido', () => {
    expect(skinById('inexistente').id).toBe('hardwood')
  })
})

describe('frames', () => {
  it('none é o default e sempre disponível', () => {
    expect(DEFAULT_FRAME).toBe('none')
    expect(isFrameUnlocked(frameById('none'), 1)).toBe(true)
  })

  it('dourada desbloqueia no nível 15', () => {
    const gold = frameById('gold')
    expect(isFrameUnlocked(gold, 14)).toBe(false)
    expect(isFrameUnlocked(gold, 15)).toBe(true)
  })
})
