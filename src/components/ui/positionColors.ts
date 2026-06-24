import type { Position } from '../../engine/types'

/** Cores por posição: gradiente do card (escuro→claro) + jersey da silhueta. */
export interface PositionColors {
  from: string
  to: string
  jersey: string
  text: string
}

export const POSITION_COLORS: Record<Position, PositionColors> = {
  PG: { from: '#1E40AF', to: '#3B82F6', jersey: '#1E3A8A', text: '#FFFFFF' },
  SG: { from: '#166534', to: '#22C55E', jersey: '#14532D', text: '#FFFFFF' },
  SF: { from: '#92400E', to: '#F59E0B', jersey: '#78350F', text: '#FFFFFF' },
  PF: { from: '#9F1239', to: '#EF4444', jersey: '#881337', text: '#FFFFFF' },
  C:  { from: '#4C1D95', to: '#8B5CF6', jersey: '#3B0764', text: '#FFFFFF' },
}

export function positionColors(pos: Position): PositionColors {
  return POSITION_COLORS[pos]
}
