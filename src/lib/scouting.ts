/**
 * Leitura de matchup (dicas, não recomendação): rótulos curtos dos pontos fortes/
 * fracos de um adversário (teamRatings) e do seu quinteto (ratings dos jogadores),
 * pra ajudar a escolher o esquema da série. Puro, só de UI.
 *
 * Limiares calibrados pela escala de `engine/data/teams.ts` (ritmo 56–92;
 * ataque/defesa 74–95; bola de 3 por era 10–88).
 */
import type { HistoricalTeam, Player } from '../engine/types'
import { synergyOf } from '../engine/synergy'
import { overall } from './playerStats'

export interface Trait {
  label: string
  tone: 'strong' | 'weak' | 'neutral'
}

const surname = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

/** Pontos fortes/fracos do adversário (até ~3 chips, dos mais relevantes). */
export function opponentTraits(t: HistoricalTeam): Trait[] {
  const r = t.teamRatings
  const out: Trait[] = []

  if (r.pace >= 84) out.push({ label: 'Ritmo alto', tone: 'strong' })
  else if (r.pace <= 66) out.push({ label: 'Ritmo lento', tone: 'neutral' })

  if (r.offense >= 92) out.push({ label: 'Ataque elite', tone: 'strong' })
  else if (r.offense >= 88) out.push({ label: 'Ataque forte', tone: 'strong' })
  else if (r.offense <= 80) out.push({ label: 'Ataque fraco', tone: 'weak' })

  if (r.defense >= 92) out.push({ label: 'Defesa elite', tone: 'strong' })
  else if (r.defense >= 86) out.push({ label: 'Defesa forte', tone: 'strong' })
  else if (r.defense <= 80) out.push({ label: 'Defesa fraca', tone: 'weak' })

  if (r.threePointRate >= 72) out.push({ label: 'Chove de 3', tone: 'strong' })
  else if (r.threePointRate <= 30) out.push({ label: 'Pouca bola de 3', tone: 'neutral' })

  if (r.clutch >= 92) out.push({ label: 'Clutch', tone: 'strong' })

  return out.slice(0, 3)
}

const avg = (team: Player[], key: keyof Player['ratings']): number =>
  team.reduce((s, p) => s + p.ratings[key], 0) / Math.max(1, team.length)

/** Perfil do seu quinteto (até ~3 chips). */
export function teamTraits(team: Player[]): Trait[] {
  if (team.length === 0) return []
  const out: Trait[] = []

  // Sinergia de era (coesão) — prioritária na lista (afeta a simulação).
  const syn = synergyOf(team)
  if (syn.era && syn.count >= 3) out.push({ label: `Sinergia ${syn.era} ×${syn.count}`, tone: 'strong' })

  const byOverall = [...team].sort((a, b) => overall(b) - overall(a))
  if (byOverall.length >= 2 && overall(byOverall[0]) - overall(byOverall[1]) >= 5) {
    out.push({ label: `Craque: ${surname(byOverall[0].name)}`, tone: 'strong' })
  }

  const three = avg(team, 'threePoint')
  if (three >= 78) out.push({ label: 'Bom de 3', tone: 'strong' })
  else if (three <= 45) out.push({ label: 'Fraco de 3', tone: 'weak' })

  if (avg(team, 'rebounding') >= 82) out.push({ label: 'Forte por dentro', tone: 'strong' })
  if (avg(team, 'speed') >= 82) out.push({ label: 'Veloz', tone: 'strong' })
  if (avg(team, 'defense') >= 84) out.push({ label: 'Bom defensor', tone: 'strong' })

  return out.slice(0, 3)
}
