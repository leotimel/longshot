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

function PlayerCard({ player, onSelect }: { player: Player; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="min-w-0 border-2 border-zinc-900 bg-white p-2 text-left text-zinc-900 shadow-[3px_3px_0_0_#18181b] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-[3px_3px_0_0_#fafafa]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-extrabold uppercase leading-tight">{player.name}</span>
        <span className="shrink-0 text-2xl font-black leading-none text-fuchsia-600 dark:text-fuchsia-400">
          {overall(player)}
        </span>
      </div>
      <div className="text-[10px] uppercase opacity-70">{player.era}</div>
      <div className="mt-1 flex flex-wrap gap-1">
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
  const [picks, setPicks] = useState<(number | null)[]>(() => POSITIONS.map(() => null))
  const current = picks.findIndex((p) => p === null) // -1 quando todas escolhidas
  const allChosen = current === -1
  const fr = draft.bracket[0]

  const team = useMemo(
    () => (allChosen ? draft.playerPool.map((opts, i) => opts[picks[i] as number]) : []),
    [allChosen, draft.playerPool, picks],
  )

  const pick = (c: number) =>
    setPicks((prev) => prev.map((p, i) => (i === current ? c : p)))

  const back = () => {
    const last = current === -1 ? POSITIONS.length - 1 : current - 1
    if (last >= 0) setPicks((prev) => prev.map((p, i) => (i === last ? null : p)))
  }

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

      {/* Draft: uma posição por vez, 3 opções */}
      <section className="flex flex-1 flex-col gap-2">
        {!allChosen && (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">
                {S.draft.choose(S.positions[POSITIONS[current]])}
              </span>
              <span className="text-[11px] font-bold opacity-60">
                {S.draft.stepOf(current + 1, POSITIONS.length)}
              </span>
            </div>
            <div key={current} className="ls-rise grid grid-cols-1 gap-2">
              {draft.playerPool[current].map((player, c) => (
                <PlayerCard key={player.id} player={player} onSelect={() => pick(c)} />
              ))}
            </div>
          </>
        )}

        {/* Quinteto montado até aqui */}
        {picks.some((p) => p !== null) && (
          <div className="flex flex-wrap gap-1">
            {POSITIONS.map((pos, i) =>
              picks[i] !== null ? (
                <span
                  key={pos}
                  className="border border-zinc-900 bg-teal-300 px-1 text-[10px] font-bold text-zinc-900 dark:border-zinc-100"
                >
                  {pos} {shortName(draft.playerPool[i][picks[i] as number].name)}
                </span>
              ) : null,
            )}
          </div>
        )}

        {!allChosen && current > 0 && (
          <button
            type="button"
            onClick={back}
            className="inline-flex min-h-11 items-center self-start text-[11px] font-bold uppercase tracking-wide opacity-70"
          >
            ← {S.positions[POSITIONS[current - 1]]}
          </button>
        )}
      </section>

      {/* Resumo + ação */}
      {allChosen && (
        <footer className="border-t-2 border-dashed border-zinc-400 pt-2">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-snug">
              <span className="font-black uppercase">{S.draft.summaryLabel}</span>{' '}
              {team.map((p) => `${shortName(p.name)} (${overall(p)})`).join(' · ')}
            </p>
            <p className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
              {S.draft.irreversible}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={back}
                className="min-h-11 border-2 border-zinc-900 bg-white px-3 text-sm font-black uppercase dark:border-zinc-100 dark:bg-zinc-900"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onStartPlayoff(picks as number[])}
                className="min-h-11 flex-1 border-2 border-zinc-900 bg-yellow-400 py-3 text-base font-black uppercase tracking-wide text-zinc-900 shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:shadow-[4px_4px_0_0_#fafafa]"
              >
                {S.draft.start}
              </button>
            </div>
          </div>
        </footer>
      )}
    </main>
  )
}
