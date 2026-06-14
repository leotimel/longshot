import { useState } from 'react'
import { POSITIONS, type Player, type PlayerRatings, type Position } from '../engine/types'
import type { DailyDraft } from '../engine/draft'
import { strings as S } from '../lib/strings'

const TEAM_RATING_KEYS = ['offense', 'defense', 'pace', 'threePointRate', 'clutch'] as const

function overall(p: Player): number {
  const r = p.ratings
  return Math.round(
    (r.speed + r.shooting + r.threePoint + r.defense + r.passing + r.rebounding + r.clutch) / 7,
  )
}

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
      <span className="w-16 shrink-0 font-bold uppercase tracking-wide">{label}</span>
      <div className="h-2.5 flex-1 border border-zinc-900 bg-white/60 dark:border-zinc-100 dark:bg-black/40">
        <div className="h-full bg-fuchsia-500" style={{ width: `${value}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right font-mono font-bold">{value}</span>
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
        'w-full border-2 border-zinc-900 p-2 text-left dark:border-zinc-100',
        disabled
          ? 'bg-zinc-200 opacity-50 dark:bg-zinc-800'
          : 'bg-white text-zinc-900 shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-[3px_3px_0_0_#fafafa]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1">
          <span className="shrink-0 border border-zinc-900 bg-teal-300 px-1 text-[10px] font-black text-zinc-900 dark:border-zinc-100">
            {player.position}
          </span>
          <span className="truncate text-sm font-extrabold uppercase leading-tight">{player.name}</span>
        </span>
        <span className="shrink-0 text-2xl font-black leading-none text-fuchsia-600 dark:text-fuchsia-400">
          {overall(player)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="text-[10px] uppercase opacity-70">{player.era}</span>
        {disabled ? (
          <span className="text-[10px] font-bold uppercase opacity-80">· {S.draft.posTaken}</span>
        ) : (
          topRatings(player, 3).map((t) => (
            <span
              key={t.label}
              className="border border-zinc-900 bg-teal-300 px-1 text-[10px] font-bold text-zinc-900 dark:border-zinc-100"
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
  challengeTarget,
}: {
  draft: DailyDraft
  onStartPlayoff: (team: Player[]) => void
  onOpenStats?: () => void
  onOpenHelp?: () => void
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

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-3 bg-zinc-100 p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black uppercase italic tracking-tight">{S.appName}</h1>
        <div className="flex items-center gap-1">
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              aria-label={S.a11y.help}
              className="border-2 border-zinc-900 min-h-11 min-w-11 inline-flex items-center justify-center px-2 py-1 text-lg font-black leading-none dark:border-zinc-100"
            >
              ?
            </button>
          )}
          {onOpenStats && (
            <button
              type="button"
              onClick={onOpenStats}
              aria-label={S.a11y.stats}
              className="border-2 border-zinc-900 min-h-11 min-w-11 inline-flex items-center justify-center px-2 py-1 text-lg leading-none dark:border-zinc-100"
            >
              📊
            </button>
          )}
        </div>
      </header>

      {challengeTarget && (
        <div className="border-2 border-zinc-900 bg-fuchsia-500 px-3 py-2 text-center text-sm font-black uppercase text-white dark:border-zinc-100">
          {S.draft.beat(challengeTarget)}
        </div>
      )}

      {/* Bracket do dia */}
      <section>
        <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wide opacity-70">{S.draft.path}</h2>
        <ol className="flex gap-1">
          {draft.bracket.map((t, i) => (
            <li
              key={t.id}
              className={[
                'flex-1 basis-0 border-2 border-zinc-900 p-1 text-center dark:border-zinc-100',
                i === 0 ? 'bg-fuchsia-500 text-white' : 'bg-white/70 opacity-70 dark:bg-zinc-900/70',
              ].join(' ')}
            >
              <div className="text-[9px] font-black uppercase">{S.rounds.tags[i]}</div>
              <div className="truncate text-[11px] font-bold leading-tight">{shortName(t.name)}</div>
              <div className="text-[9px] opacity-80">{t.season}</div>
            </li>
          ))}
        </ol>
        <div className="mt-2 border-2 border-zinc-900 bg-white p-2 dark:border-zinc-100 dark:bg-zinc-900">
          <div className="mb-1 text-[11px] font-black uppercase">
            {S.rounds.names[0]} · {fr.name} {fr.season}
          </div>
          <div className="flex flex-col gap-0.5">
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
              <span className="min-w-0 truncate text-sm font-black uppercase italic">
                {team.name} <span className="opacity-60">{team.season}</span>
              </span>
              <span className="shrink-0 text-[11px] font-bold opacity-60">
                {S.draft.stepOf(filledCount + 1, POSITIONS.length)}
              </span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
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
                className="min-h-11 self-start border-2 border-zinc-900 bg-white px-3 text-[11px] font-black uppercase dark:border-zinc-100 dark:bg-zinc-900"
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
                  className="border border-zinc-900 bg-teal-300 px-1 text-[10px] font-bold text-zinc-900 dark:border-zinc-100"
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
        <footer className="border-t-2 border-dashed border-zinc-400 pt-2">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-snug">
              <span className="font-black uppercase">{S.draft.summaryLabel}</span>{' '}
              {POSITIONS.map((pos) => {
                const pl = chosen[pos] as Player
                return `${shortName(pl.name)} (${overall(pl)})`
              }).join(' · ')}
            </p>
            <p className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
              {S.draft.irreversible}
            </p>
            <button
              type="button"
              onClick={start}
              className="min-h-11 border-2 border-zinc-900 bg-yellow-400 py-3 text-base font-black uppercase tracking-wide text-zinc-900 shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:shadow-[4px_4px_0_0_#fafafa]"
            >
              {S.draft.start}
            </button>
          </div>
        </footer>
      )}
    </main>
  )
}
