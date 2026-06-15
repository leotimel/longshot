/**
 * Skins (visual) desbloqueáveis por nível. Os VALORES das cores ficam no CSS
 * (`:root[data-theme="..."]` em index.css); aqui mora só o metadado (nome, nível
 * de unlock, swatch pro preview) e a aplicação no documento. Um skin pode ser só
 * um pack de acento (muda o realce) ou um tema completo (muda o conjunto todo).
 */
export interface SkinMeta {
  id: string
  name: string
  /** Pack de acento (true) ou tema completo (false). */
  accentOnly: boolean
  /** Nível necessário pra desbloquear (1 = sempre disponível). */
  unlockLevel: number
  /** Cores pro preview (swatch, tons claros): superfície e acento. */
  swatch: { surface: string; accent: string }
}

export const SKINS: SkinMeta[] = [
  { id: 'hardwood', name: 'Hardwood', accentOnly: false, unlockLevel: 1, swatch: { surface: '#fffbeb', accent: '#b45309' } },
  { id: 'fire', name: 'Bola de fogo', accentOnly: true, unlockLevel: 3, swatch: { surface: '#fffbeb', accent: '#ea580c' } },
  { id: 'gold', name: 'Ouro vintage', accentOnly: true, unlockLevel: 6, swatch: { surface: '#fffbeb', accent: '#a16207' } },
  { id: 'royal', name: 'Clássico azul', accentOnly: true, unlockLevel: 9, swatch: { surface: '#fffbeb', accent: '#1d4ed8' } },
  { id: 'clean', name: 'Clean esportivo', accentOnly: false, unlockLevel: 12, swatch: { surface: '#ffffff', accent: '#2563eb' } },
  { id: 'almanaque', name: 'Almanaque', accentOnly: false, unlockLevel: 25, swatch: { surface: '#fbf9f1', accent: '#b91c1c' } },
  { id: 'arcade', name: 'Arcade', accentOnly: false, unlockLevel: 40, swatch: { surface: '#141b3a', accent: '#22d3ee' } },
]

export const DEFAULT_SKIN = 'hardwood'

export function skinById(id: string): SkinMeta {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]
}

export function isSkinUnlocked(skin: SkinMeta, level: number): boolean {
  return level >= skin.unlockLevel
}

/** Aplica o skin no documento (atributo `data-theme` no <html>). */
export function applySkin(id: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = id
  }
}
