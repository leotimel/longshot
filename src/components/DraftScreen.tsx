import { useMemo, useState } from 'react'
import { POSITIONS, type Player, type PlayerRatings } from '../engine/types'
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
  selected,
  dimmed,
  onSelect,
}: {
  player: Player
  selected: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'flex-1 basis-0 min-w-0 border-2 border-zinc-900 p-2 text-left transition dark:border-zinc-100',
        'shadow-[3px_3px_0_0_#18181b] dark:shadow-[3px_3px_0_0_#fafafa]',
        selected
          ? 'bg-yellow-300 text-zinc-900 -translate-x-0.5 -translate-y-0.5'
          : 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50',
        dimmed ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[13px] font-extrabold uppercase leading-tight">{player.name}</span>
        {selected && <span aria-hidden className="text-base font-black">✓</span>}
      </div>
      <div className="text-[10px] uppercase opacity-70">
        {S.positions[player.position]} · {player.era}
      </div>
      <div className="my-0.5 flex items-baseline gap-1">
        <span className="text-2xl font-black leading-none text-fuchsia-600 dark:text-fuchsia-400">
          {overall(player)}
        </span>
        <span className="text-[9px] font-bold uppercase opacity-60">{S.draft.ovr}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {topRatings(player, 3).map((t) => (
          <span
            key={t.label}
            className="border border-zinc-900 bg-teal-300 px-1 text-[10px] font-bold text-zinc-900 dark:border-zinc-100"
          >
            {t.label} {t.value}
          </span>
        ))}
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
  onStartPlayoff: (picks: number[]) => void
  onOpenStats?: () => void
  onOpenHelp?: () => void
  challengeTarget?: string
}) {
  const [picks, setPicks] = useState<(0 | 1 | null)[]>(() => POSITIONS.map(() => null))
  const chosen = picks.filter((p) => p !== null).length
  const allChosen = chosen === POSITIONS.length
  const fr = draft.bracket[0]

  const team = useMemo(
    () => (allChosen ? draft.playerPool.map((pair, i) => pair[picks[i] as 0 | 1]) : []),
    [allChosen, draft.playerPool, picks],
  )

  const select = (posIndex: number, choice: 0 | 1) =>
    setPicks((prev) => prev.map((p, i) => (i === posIndex ? choice : p)))

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
                i === 0
                  ? 'bg-fuchsia-500 text-white'
                  : 'bg-white/70 opacity-70 dark:bg-zinc-900/70',
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

      {/* Duplas por posição */}
      <section className="flex flex-1 flex-col gap-2">
        {POSITIONS.map((pos, i) => (
          <div key={pos}>
            <div className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
              {pos}
            </div>
            <div className="flex gap-2">
              {([0, 1] as const).map((c) => (
                <PlayerCard
                  key={draft.playerPool[i][c].id}
                  player={draft.playerPool[i][c]}
                  selected={picks[i] === c}
                  dimmed={picks[i] !== null && picks[i] !== c}
                  onSelect={() => select(i, c)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Resumo + ação */}
      <footer className="border-t-2 border-dashed border-zinc-400 pt-2">
        {allChosen ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-snug">
              <span className="font-black uppercase">{S.draft.summaryLabel}</span>{' '}
              {team.map((p) => `${shortName(p.name)} (${overall(p)})`).join(' · ')}
            </p>
            <p className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
              {S.draft.irreversible}
            </p>
            <button
              type="button"
              onClick={() => onStartPlayoff(picks as number[])}
              className="border-2 border-zinc-900 bg-yellow-400 py-3 text-base font-black uppercase tracking-wide text-zinc-900 shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:shadow-[4px_4px_0_0_#fafafa]"
            >
              {S.draft.start}
            </button>
          </div>
        ) : (
          <div className="text-center text-xs font-bold uppercase tracking-wide opacity-70">
            {S.draft.progress(chosen, POSITIONS.length)}
          </div>
        )}
      </footer>
    </main>
  )
}
