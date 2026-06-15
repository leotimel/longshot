import { useState } from 'react'
import { POSITIONS, type Player, type PlayerRatings, type Position } from '../engine/types'
import type { DailyDraft } from '../engine/draft'
import type { LevelInfo } from '../lib/level'
import { strings as S } from '../lib/strings'
import { overall } from '../lib/playerStats'
import { LevelBadge } from './LevelBadge'

const TEAM_RATING_KEYS = ['offense', 'defense', 'pace', 'threePointRate', 'clutch'] as const

function topRatings(p: Player, n: number): { label: string; value: number }[] {
  return (Object.keys(p.ratings) as (keyof PlayerRatings)[])
    .map((k) => ({ label: S.ratings[k], value: p.ratings[k] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name
const byPosition = (a: Player, b: Player) =>
  POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position)

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

function PlayerCard({
  player,
  disabled,
  onSelect,
}: {
  player: Player
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={[
        'w-full rounded-lg border p-2.5 text-left transition',
        disabled
          ? 'border-line bg-surface2 opacity-60'
          : 'border-line bg-surface shadow-sm hover:border-accent hover:bg-accent-soft',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 rounded bg-accent-soft px-1 text-[10px] font-bold text-accent">
            {player.position}
          </span>
          <span className="truncate text-sm font-semibold leading-tight">{player.name}</span>
        </span>
        <span className="font-display shrink-0 text-2xl font-bold leading-none text-accent">
          {overall(player)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="text-[10px] uppercase tracking-wide text-muted">{player.era}</span>
        {disabled ? (
          <span className="text-[10px] font-medium text-muted">· {S.draft.posTaken}</span>
        ) : (
          topRatings(player, 3).map((t) => (
            <span
              key={t.label}
              className="rounded bg-pos-soft px-1.5 py-0.5 text-[10px] font-semibold text-pos"
            >
              {t.label} {t.value}
            </span>
          ))
        )}
      </div>
    </button>
  )
}

export function DraftScreen({
  draft,
  onStartPlayoff,
  onOpenStats,
  onOpenHelp,
  level,
  challengeTarget,
}: {
  draft: DailyDraft
  onStartPlayoff: (team: Player[]) => void
  onOpenStats?: () => void
  onOpenHelp?: () => void
  level?: LevelInfo
  challengeTarget?: string
}) {
  const [teamIndex, setTeamIndex] = useState(0)
  const [chosen, setChosen] = useState<Partial<Record<Position, Player>>>({})
  const [rerollUsed, setRerollUsed] = useState(false)

  const fr = draft.bracket[0]
  const filledCount = POSITIONS.filter((pos) => chosen[pos]).length
  const allChosen = filledCount === POSITIONS.length
  const team = draft.draftTeams[teamIndex % draft.draftTeams.length]

  const pick = (player: Player) => {
    setChosen((prev) => ({ ...prev, [player.position]: player }))
    setTeamIndex((i) => i + 1)
  }

  const reroll = () => {
    setRerollUsed(true)
    setTeamIndex((i) => i + 1)
  }

  const start = () => onStartPlayoff(POSITIONS.map((pos) => chosen[pos] as Player))

  const iconBtn =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line text-lg leading-none'

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-3 bg-canvas p-3 text-ink">
      <header className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">{S.appName}</h1>
        <div className="flex items-center gap-2">
          {level && onOpenStats && <LevelBadge level={level} onClick={onOpenStats} />}
          {onOpenHelp && (
            <button type="button" onClick={onOpenHelp} aria-label={S.a11y.help} className={iconBtn}>
              ?
            </button>
          )}
          {onOpenStats && (
            <button type="button" onClick={onOpenStats} aria-label={S.a11y.stats} className={iconBtn}>
              📊
            </button>
          )}
        </div>
      </header>

      {challengeTarget && (
        <div className="rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-on-accent">
          {S.draft.beat(challengeTarget)}
        </div>
      )}

      {/* Bracket do dia */}
      <section>
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
          {S.draft.path}
        </h2>
        <ol className="flex gap-1.5">
          {draft.bracket.map((t, i) => (
            <li
              key={t.id}
              className={[
                'flex-1 basis-0 rounded-lg border p-1 text-center',
                i === 0 ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
              ].join(' ')}
            >
              <div className="text-[9px] font-bold uppercase text-muted">{S.rounds.tags[i]}</div>
              <div className="truncate text-[11px] font-semibold leading-tight">{shortName(t.name)}</div>
              <div className="text-[9px] text-muted">{t.season}</div>
            </li>
          ))}
        </ol>
        <div className="mt-2 rounded-lg border border-line bg-surface p-2.5 shadow-sm">
          <div className="mb-1 text-[11px] font-semibold">
            {S.rounds.names[0]} · {fr.name} {fr.season}
          </div>
          <div className="flex flex-col gap-1">
            {TEAM_RATING_KEYS.map((key) => (
              <RatingBar key={key} label={S.teamRatings[key]} value={fr.teamRatings[key]} />
            ))}
          </div>
        </div>
      </section>

      {/* Draft: um time por vez */}
      <section className="flex flex-1 flex-col gap-2">
        {!allChosen && (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-bold">
                {team.name} <span className="font-normal text-muted">{team.season}</span>
              </span>
              <span className="shrink-0 text-[11px] font-medium text-muted">
                {S.draft.stepOf(filledCount + 1, POSITIONS.length)}
              </span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-pos">
              {S.draft.pickPlayer}
            </div>
            <div key={teamIndex} className="ls-rise grid grid-cols-1 gap-2">
              {[...team.roster].sort(byPosition).map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  disabled={Boolean(chosen[player.position])}
                  onSelect={() => pick(player)}
                />
              ))}
            </div>
            {!rerollUsed && (
              <button
                type="button"
                onClick={reroll}
                className="min-h-11 self-start rounded-lg border border-line bg-surface px-3 text-[11px] font-semibold transition hover:bg-surface2"
              >
                {S.draft.reroll}
              </button>
            )}
          </>
        )}

        {/* Quinteto montado até aqui */}
        {filledCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {POSITIONS.map((pos) =>
              chosen[pos] ? (
                <span
                  key={pos}
                  className="rounded bg-pos-soft px-1.5 py-0.5 text-[10px] font-semibold text-pos"
                >
                  {pos} {shortName((chosen[pos] as Player).name)}
                </span>
              ) : null,
            )}
          </div>
        )}
      </section>

      {/* Resumo + ação */}
      {allChosen && (
        <footer className="border-t-2 border-line pt-3">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-snug">
              <span className="font-semibold">{S.draft.summaryLabel}</span>{' '}
              {POSITIONS.map((pos) => {
                const pl = chosen[pos] as Player
                return `${shortName(pl.name)} (${overall(pl)})`
              }).join(' · ')}
            </p>
            <p className="text-[11px] font-medium text-accent">{S.draft.irreversible}</p>
            <button
              type="button"
              onClick={start}
              className="font-display rounded-lg bg-accent py-3 text-lg font-bold uppercase tracking-wide text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90"
            >
              {S.draft.start}
            </button>
          </div>
        </footer>
      )}
    </main>
  )
}
