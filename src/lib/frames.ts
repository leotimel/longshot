/**
 * Molduras (anéis) dos cards do quinteto, desbloqueáveis por nível. `ring` é a
 * classe Tailwind aplicada ao card; só metadado + classe, sem estado global.
 */
export interface FrameMeta {
  id: string
  name: string
  unlockLevel: number
  /** Classe de anel/borda aplicada ao card (vazia = sem moldura). */
  ring: string
  /** Swatch (cor do anel) pro preview. */
  swatch: string
}

export const FRAMES: FrameMeta[] = [
  { id: 'none', name: 'Nenhuma', unlockLevel: 1, ring: '', swatch: 'transparent' },
  { id: 'gold', name: 'Dourada', unlockLevel: 15, ring: 'ring-2 ring-amber-400', swatch: '#fbbf24' },
  { id: 'neon', name: 'Neon', unlockLevel: 30, ring: 'ring-2 ring-fuchsia-400', swatch: '#e879f9' },
  { id: 'champion', name: 'Campeão', unlockLevel: 60, ring: 'ring-2 ring-offset-2 ring-amber-300', swatch: '#fcd34d' },
]

export const DEFAULT_FRAME = 'none'

export function frameById(id: string): FrameMeta {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0]
}

export function isFrameUnlocked(frame: FrameMeta, level: number): boolean {
  return level >= frame.unlockLevel
}
