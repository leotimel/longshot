import { useEffect, useRef, useState } from 'react'
import type { BracketResult, HistoricalTeam, Player } from '../engine/types'
import { strings as S } from '../lib/strings'
import { overall } from '../lib/playerStats'
import { GameFeed } from './GameFeed'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

const SHELL =
  'mx-auto flex min-h-svh max-w-md flex-col gap-3 bg-zinc-50 p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50'
const ICON_BTN =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-300 text-lg leading-none dark:border-zinc-700'
const WON = 'text-emerald-600 dark:text-emerald-400'
const LOST = 'text-rose-500 dark:text-rose-400'

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
          <h1 className="text-lg font-bold">{S.rounds.names[view.round]}</h1>
          <span className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
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
          <h1 className="text-lg font-bold">{S.rounds.names[view.round]}</h1>
          <span className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
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
            className="inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            {S.bracket.back}
          </button>
          <h1 className="mt-1 text-xl font-bold">{S.rounds.names[view.round]}</h1>
          <div className="text-sm font-medium">
            {S.bracket.vs(opp.name)}{' '}
            <span className="text-zinc-500 dark:text-zinc-400">{opp.season}</span>
          </div>
          <div className="mt-1 text-2xl font-bold">
            {series.gamesWon}
            <span className="text-zinc-400">-</span>
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
                  className="flex min-h-11 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
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
        <h1 className="text-2xl font-bold tracking-tight">{S.bracket.title}</h1>
      </header>

      {/* Status do dia: hero comemorativo (campeão) ou selo/eliminado/round atual. */}
      {fullyRevealed ? (
        champion ? (
          <div className="ls-celebrate rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 px-4 py-5 text-center text-white shadow-md">
            <div className="text-5xl leading-none">🏆</div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{S.bracket.championTitle}</div>
            <div className="mt-0.5 text-xs font-medium text-blue-100">{S.bracket.championSub}</div>
          </div>
        ) : dayBadge ? (
          <div className="rounded-xl border border-zinc-200 bg-white py-3 text-center text-lg font-bold shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {dayBadge} {S.rounds.names[roundsWon - 1]}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white py-3 text-center text-sm font-medium text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {S.bracket.eliminated}
          </div>
        )
      ) : (
        <div className="text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {S.rounds.names[revealed]}
        </div>
      )}

      {/* Seu quinteto — preenche o topo e mostra o time escalado. */}
      {team && (
        <section>
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {S.bracket.lineup}
          </h2>
          <ol className="grid grid-cols-5 gap-1.5">
            {team.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-zinc-200 bg-white p-1 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="rounded bg-blue-100 text-[9px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {p.position}
                </div>
                <div className="mt-0.5 truncate text-[10px] font-medium leading-tight" title={p.name}>
                  {shortName(p.name)}
                </div>
                <div className="text-base font-bold leading-none text-blue-600 dark:text-blue-400">
                  {overall(p)}
                </div>
              </li>
            ))}
          </ol>
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
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                >
                  <span className="w-6 shrink-0 text-center text-lg">{won ? S.badges.emoji[i] : '⬜'}</span>
                  <span className="w-7 shrink-0 text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                    {S.rounds.tags[i]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{shortName(opp.name)}</span>
                    <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">{opp.season}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-1.5">
                      {sweep && (
                        <span className="rounded bg-emerald-100 px-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
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
                        <span key={`w${d}`} className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ))}
                      {Array.from({ length: series.gamesLost }).map((_, d) => (
                        <span key={`l${d}`} className="h-1.5 w-1.5 rounded-full bg-rose-400" />
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
                <div className="rounded-xl border-2 border-blue-600 bg-white p-2.5 dark:bg-zinc-900">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="w-7 shrink-0 text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                      {S.rounds.tags[i]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{shortName(opp.name)}</span>
                      <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">{opp.season}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">
                      {S.bracket.toPlay}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setView({ kind: 'playing', round: i, game: 0 })}
                      className="min-h-11 flex-1 rounded-lg bg-blue-600 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800"
                    >
                      {S.bracket.playByGame}
                    </button>
                    <button
                      type="button"
                      onClick={revealRound}
                      className="min-h-11 flex-1 rounded-lg border border-zinc-300 bg-white py-2 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
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
              <div className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-left opacity-60 dark:border-zinc-700">
                <span className="w-6 shrink-0 text-center text-lg">{S.bracket.hidden}</span>
                <span className="w-7 shrink-0 text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  {S.rounds.tags[i]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{shortName(opp.name)}</span>
                  <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">{opp.season}</span>
                </span>
                <span className="shrink-0 text-zinc-400">—</span>
              </div>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
