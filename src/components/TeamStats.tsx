import type { HistoricalTeam } from '../engine/types'
import { strings as S } from '../lib/strings'

const TEAM_RATING_KEYS = ['offense', 'defense', 'pace', 'threePointRate', 'clutch'] as const

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-16 shrink-0 font-medium uppercase tracking-wide text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right font-mono font-semibold">{value}</span>
    </div>
  )
}

/** Painel de stats de um time histórico (barras de teamRatings) — scouting do adversário. */
export function TeamStats({ team, title }: { team: HistoricalTeam; title?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5 shadow-sm">
      <div className="mb-1 text-[11px] font-semibold">{title ?? `${team.name} ${team.season}`}</div>
      <div className="flex flex-col gap-1">
        {TEAM_RATING_KEYS.map((key) => (
          <RatingBar key={key} label={S.teamRatings[key]} value={team.teamRatings[key]} />
        ))}
      </div>
    </div>
  )
}
