import { useEffect, useMemo, useRef, useState } from 'react'
import type { BracketResult, HistoricalTeam, Player } from '../engine/types'
import { strings as S } from '../lib/strings'
import { overall, campaignStats } from '../lib/playerStats'
import { GameFeed } from './GameFeed'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

const SHELL =
  'mx-auto flex min-h-svh max-w-md flex-col gap-3 bg-stone-100 p-3 text-stone-900 dark:bg-stone-950 dark:text-stone-100'
const ICON_BTN =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-stone-400 text-lg leading-none dark:border-stone-600'
const WON = 'text-emerald-700 dark:text-emerald-400'
const LOST = 'text-red-700 dark:text-red-400'

type View =
  | { kind: 'overview' }
  | { kind: 'playing'; round: number; game: number }
  | { kind: 'series'; round: number }
  | { kind: 'game'; round: number; game: number }

export function BracketView({
  bracket,
  opponents,
  team,
  gradual = false,
  onPlayoffEnd,
  onOpenStats,
  onOpenHelp,
}: {
  bracket: BracketResult
  opponents: HistoricalTeam[]
  team?: Player[]
  gradual?: boolean
  onPlayoffEnd?: () => void
  onOpenStats?: () => void
  onOpenHelp?: () => void
}) {
  const { rounds, champion } = bracket
  const [revealed, setRevealed] = useState(() => (gradual ? 0 : rounds.length))
  const [view, setView] = useState<View>({ kind: 'overview' })
  const endedRef = useRef(false)

  useEffect(() => {
    if (gradual && !endedRef.current && revealed >= rounds.length) {
      endedRef.current = true
      onPlayoffEnd?.()
    }
  }, [gradual, revealed, rounds.length, onPlayoffEnd])

  const fullyRevealed = revealed >= rounds.length
  const roundsWon = rounds.slice(0, revealed).filter((s) => s.winner === 'player').length
  const dayBadge = roundsWon > 0 ? S.badges.emoji[roundsWon - 1] : null

  // Estatísticas da campanha só ao fim — durante a revelação gradual seriam spoiler.
  const camp = useMemo(() => (fullyRevealed ? campaignStats(bracket) : null), [fullyRevealed, bracket])

  const revealRound = () => {
    setRevealed((r) => Math.min(rounds.length, r + 1))
    setView({ kind: 'overview' })
  }

  // ── Jogando o round atual (jogo a jogo) ──────────────────────────────────
  if (view.kind === 'playing') {
    const series = rounds[view.round]
    const isLast = view.game + 1 >= series.games.length
    return (
      <main className={SHELL}>
        <header className="flex items-baseline justify-between gap-2">
          <h1 className="font-display text-lg font-bold uppercase tracking-wide">{S.rounds.names[view.round]}</h1>
          <span className="truncate text-[11px] font-medium text-stone-500 dark:text-stone-400">
            {S.bracket.vs(shortName(opponents[view.round].name))}
          </span>
        </header>
        <GameFeed
          key={`p-${view.round}-${view.game}`}
          game={series.games[view.game]}
          opponentName={opponents[view.round].name}
          gameNumber={view.game + 1}
          onNext={
            isLast
              ? undefined
              : () => setView({ kind: 'playing', round: view.round, game: view.game + 1 })
          }
          onBackToSeries={revealRound}
          backLabel={isLast ? S.bracket.seeResult : S.bracket.fastForward}
        />
      </main>
    )
  }

  // ── Re-assistir um jogo de um round revelado ─────────────────────────────
  if (view.kind === 'game') {
    const series = rounds[view.round]
    return (
      <main className={SHELL}>
        <header className="flex items-baseline justify-between gap-2">
          <h1 className="font-display text-lg font-bold uppercase tracking-wide">{S.rounds.names[view.round]}</h1>
          <span className="truncate text-[11px] font-medium text-stone-500 dark:text-stone-400">
            {S.bracket.vs(shortName(opponents[view.round].name))}
          </span>
        </header>
        <GameFeed
          key={`w-${view.round}-${view.game}`}
          game={series.games[view.game]}
          opponentName={opponents[view.round].name}
          gameNumber={view.game + 1}
          totalGames={series.games.length}
          onNext={
            view.game + 1 < series.games.length
              ? () => setView({ kind: 'game', round: view.round, game: view.game + 1 })
              : undefined
          }
          onBackToSeries={() => setView({ kind: 'series', round: view.round })}
        />
      </main>
    )
  }

  // ── Resumo de um round revelado (re-assistir) ────────────────────────────
  if (view.kind === 'series') {
    const series = rounds[view.round]
    const opp = opponents[view.round]
    const won = series.winner === 'player'
    return (
      <main className={SHELL}>
        <header>
          <button
            type="button"
            onClick={() => setView({ kind: 'overview' })}
            className="inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400"
          >
            {S.bracket.back}
          </button>
          <h1 className="font-display mt-1 text-xl font-bold uppercase tracking-wide">{S.rounds.names[view.round]}</h1>
          <div className="text-sm font-medium">
            {S.bracket.vs(opp.name)}{' '}
            <span className="text-stone-500 dark:text-stone-400">{opp.season}</span>
          </div>
          <div className="font-display mt-1 text-2xl font-bold">
            {series.gamesWon}
            <span className="text-stone-400">-</span>
            {series.gamesLost}{' '}
            <span className={`text-sm ${won ? WON : LOST}`}>{won ? S.bracket.won : S.bracket.lost}</span>
          </div>
        </header>
        <ul className="flex flex-col gap-2">
          {series.games.map((g, i) => {
            const gWon = g.homeScore > g.awayScore
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setView({ kind: 'game', round: view.round, game: i })}
                  className="flex min-h-11 w-full items-center justify-between rounded-lg border border-stone-300 bg-amber-50 px-3 py-2 font-medium shadow-sm transition hover:bg-amber-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800/50"
                >
                  <span className="text-sm">{S.bracket.game(i + 1)}</span>
                  <span className="font-mono">
                    {g.homeScore}-{g.awayScore}{' '}
                    <span className={gWon ? WON : LOST}>{gWon ? S.bracket.wonShort : S.bracket.lostShort}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </main>
    )
  }

  // ── Overview (revelação gradual) ─────────────────────────────────────────
  return (
    <main className={SHELL}>
      <header className="relative text-center">
        <div className="absolute right-0 top-0 flex gap-1.5">
          {onOpenHelp && (
            <button type="button" onClick={onOpenHelp} aria-label={S.a11y.help} className={ICON_BTN}>
              ?
            </button>
          )}
          {onOpenStats && (
            <button type="button" onClick={onOpenStats} aria-label={S.a11y.stats} className={ICON_BTN}>
              📊
            </button>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">{S.bracket.title}</h1>
      </header>

      {/* Status do dia: hero comemorativo (campeão) ou selo/eliminado/round atual. */}
      {fullyRevealed ? (
        champion ? (
          <div className="ls-celebrate rounded-xl bg-gradient-to-b from-amber-600 to-orange-800 px-4 py-5 text-center text-white shadow-md">
            <div className="text-5xl leading-none">🏆</div>
            <div className="font-display mt-2 text-3xl font-bold uppercase tracking-wide">{S.bracket.championTitle}</div>
            <div className="mt-0.5 text-xs font-medium text-amber-100">{S.bracket.championSub}</div>
          </div>
        ) : dayBadge ? (
          <div className="rounded-lg border border-stone-300 bg-amber-50 py-3 text-center text-lg font-bold shadow-sm dark:border-stone-700 dark:bg-stone-900">
            {dayBadge} {S.rounds.names[roundsWon - 1]}
          </div>
        ) : (
          <div className="rounded-lg border border-stone-300 bg-amber-50 py-3 text-center text-sm font-medium text-stone-500 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
            {S.bracket.eliminated}
          </div>
        )
      ) : (
        <div className="text-center text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {S.rounds.names[revealed]}
        </div>
      )}

      {/* Seu quinteto — preenche o topo, mostra o time escalado e (no fim) os stats da campanha. */}
      {team && (
        <section>
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {S.bracket.lineup}
          </h2>
          <ol className="grid grid-cols-5 gap-1.5">
            {team.map((p) => {
              const cs = camp?.byPlayer.get(p.id)
              const isMvp = camp?.mvpId === p.id
              return (
                <li
                  key={p.id}
                  className={[
                    'rounded-lg border bg-amber-50 p-1 text-center shadow-sm dark:bg-stone-900',
                    isMvp
                      ? 'border-emerald-500 ring-1 ring-emerald-500'
                      : 'border-stone-300 dark:border-stone-700',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="rounded bg-amber-200 px-1 text-[9px] font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                      {p.position}
                    </span>
                    {isMvp && (
                      <span className="text-[9px] leading-none" title={S.bracket.mvp}>
                        ⭐
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] font-medium leading-tight" title={p.name}>
                    {shortName(p.name)}
                  </div>
                  <div className="font-display text-base font-bold leading-none text-amber-800 dark:text-amber-300">
                    {overall(p)}
                  </div>
                  {cs && (
                    <div className="mt-0.5 font-mono text-[9px] tabular-nums text-stone-500 dark:text-stone-400">
                      {cs.ppg.toFixed(1)} {S.bracket.ppg}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          {/* Totais da campanha (só ao fim). */}
          {camp && (
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              <div className="rounded-lg border border-stone-300 bg-amber-50 p-1.5 text-center shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="font-display text-base font-bold tabular-nums">{camp.totalPoints}</div>
                <div className="text-[9px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {S.bracket.points}
                </div>
              </div>
              <div className="rounded-lg border border-stone-300 bg-amber-50 p-1.5 text-center shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="font-display text-base font-bold tabular-nums">{camp.totalGames}</div>
                <div className="text-[9px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {S.bracket.games}
                </div>
              </div>
              <div className="rounded-lg border border-stone-300 bg-amber-50 p-1.5 text-center shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="font-display text-base font-bold tabular-nums">
                  {camp.recordGame ? camp.recordGame.points : '—'}
                </div>
                <div className="truncate text-[9px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {S.bracket.recordGame}
                  {camp.recordGame ? ` · ${shortName(camp.recordGame.name)}` : ''}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <ol key={revealed} className="ls-rise flex flex-1 flex-col justify-center gap-2">
        {[0, 1, 2, 3].map((i) => {
          const opp = opponents[i]

          // Round revelado → clicável (re-assistir).
          if (i < revealed) {
            const series = rounds[i]
            const won = series.winner === 'player'
            const sweep = won && series.gamesLost === 0
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setView({ kind: 'series', round: i })}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-stone-300 bg-amber-50 px-3 py-2 text-left shadow-sm transition hover:bg-amber-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800/50"
                >
                  <span className="w-6 shrink-0 text-center text-lg">{won ? S.badges.emoji[i] : '⬜'}</span>
                  <span className="w-7 shrink-0 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    {S.rounds.tags[i]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{shortName(opp.name)}</span>
                    <span className="block text-[10px] text-stone-500 dark:text-stone-400">{opp.season}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-1.5">
                      {sweep && (
                        <span className="rounded bg-emerald-100 px-1 text-[9px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {S.bracket.sweep}
                        </span>
                      )}
                      <span className="font-mono font-semibold tabular-nums">
                        {series.gamesWon}-{series.gamesLost}{' '}
                        <span className={won ? WON : LOST}>{won ? '✓' : '✗'}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5" aria-hidden="true">
                      {Array.from({ length: series.gamesWon }).map((_, d) => (
                        <span key={`w${d}`} className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      ))}
                      {Array.from({ length: series.gamesLost }).map((_, d) => (
                        <span key={`l${d}`} className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      ))}
                    </span>
                  </span>
                </button>
              </li>
            )
          }

          // Round atual (a jogar) → escolha de ritmo.
          if (i === revealed && i < rounds.length) {
            return (
              <li key={i}>
                <div className="rounded-lg border-2 border-amber-700 bg-amber-50 p-2.5 dark:bg-stone-900">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="w-7 shrink-0 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                      {S.rounds.tags[i]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{shortName(opp.name)}</span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400">{opp.season}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-300">
                      {S.bracket.toPlay}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setView({ kind: 'playing', round: i, game: 0 })}
                      className="min-h-11 flex-1 rounded-lg bg-amber-700 py-2 text-[11px] font-semibold text-white transition hover:bg-amber-800 active:bg-amber-900"
                    >
                      {S.bracket.playByGame}
                    </button>
                    <button
                      type="button"
                      onClick={revealRound}
                      className="min-h-11 flex-1 rounded-lg border border-stone-400 bg-amber-50 py-2 text-[11px] font-semibold text-stone-700 transition hover:bg-amber-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                    >
                      {S.bracket.simRound}
                    </button>
                  </div>
                </div>
              </li>
            )
          }

          // Round bloqueado / não alcançado.
          return (
            <li key={i}>
              <div className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-stone-400 px-3 py-2 text-left opacity-60 dark:border-stone-600">
                <span className="w-6 shrink-0 text-center text-lg">{S.bracket.hidden}</span>
                <span className="w-7 shrink-0 text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                  {S.rounds.tags[i]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{shortName(opp.name)}</span>
                  <span className="block text-[10px] text-stone-500 dark:text-stone-400">{opp.season}</span>
                </span>
                <span className="shrink-0 text-stone-400">—</span>
              </div>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
