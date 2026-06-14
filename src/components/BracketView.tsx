import { useEffect, useRef, useState } from 'react'
import type { BracketResult, HistoricalTeam } from '../engine/types'
import { strings as S } from '../lib/strings'
import { GameFeed } from './GameFeed'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

const SHELL =
  'mx-auto flex min-h-svh max-w-md flex-col gap-3 bg-zinc-100 p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50'

type View =
  | { kind: 'overview' }
  | { kind: 'playing'; round: number; game: number }
  | { kind: 'series'; round: number }
  | { kind: 'game'; round: number; game: number }

export function BracketView({
  bracket,
  opponents,
  gradual = false,
  onPlayoffEnd,
  onOpenStats,
  onOpenHelp,
}: {
  bracket: BracketResult
  opponents: HistoricalTeam[]
  gradual?: boolean
  onPlayoffEnd?: () => void
  onOpenStats?: () => void
  onOpenHelp?: () => void
}) {
  const { rounds, champion } = bracket
  const [revealed, setRevealed] = useState(() => (gradual ? 0 : rounds.length))
  const [view, setView] = useState<View>({ kind: 'overview' })
  const endedRef = useRef(false)

  // Quando todos os rounds jogados foram revelados, encerra (abre o resultado).
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
          <h1 className="text-lg font-black uppercase italic">{S.rounds.names[view.round]}</h1>
          <span className="truncate text-[11px] font-bold opacity-80">
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
          <h1 className="text-lg font-black uppercase italic">{S.rounds.names[view.round]}</h1>
          <span className="truncate text-[11px] font-bold opacity-80">
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
            className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-wide opacity-80"
          >
            {S.bracket.back}
          </button>
          <h1 className="mt-1 text-xl font-black uppercase italic">{S.rounds.names[view.round]}</h1>
          <div className="text-sm font-bold">
            {S.bracket.vs(opp.name)} <span className="opacity-60">{opp.season}</span>
          </div>
          <div className="mt-1 text-2xl font-black">
            {series.gamesWon}
            <span className="opacity-40">-</span>
            {series.gamesLost}{' '}
            <span className={`text-sm ${won ? 'text-teal-600 dark:text-teal-400' : 'text-fuchsia-600 dark:text-fuchsia-400'}`}>
              {won ? S.bracket.won : S.bracket.lost}
            </span>
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
                  className="flex min-h-11 w-full items-center justify-between border-2 border-zinc-900 bg-white px-3 py-2 font-bold shadow-[3px_3px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[3px_3px_0_0_#fafafa]"
                >
                  <span className="text-sm uppercase">{S.bracket.game(i + 1)}</span>
                  <span className="font-mono">
                    {g.homeScore}-{g.awayScore}{' '}
                    <span className={gWon ? 'text-teal-600 dark:text-teal-400' : 'text-fuchsia-600 dark:text-fuchsia-400'}>
                      {gWon ? S.bracket.wonShort : S.bracket.lostShort}
                    </span>
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
        <div className="absolute right-0 top-0 flex gap-1">
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
        <h1 className="text-2xl font-black uppercase italic">{S.bracket.title}</h1>
        {fullyRevealed ? (
          champion ? (
            <div className="mt-1 border-2 border-zinc-900 bg-yellow-400 py-2 text-lg font-black uppercase text-zinc-900 dark:border-zinc-100">
              {S.bracket.champion}
            </div>
          ) : dayBadge ? (
            <div className="mt-1 text-lg font-black">
              {dayBadge} {S.rounds.names[roundsWon - 1]}
            </div>
          ) : (
            <div className="mt-1 text-sm font-bold opacity-70">{S.bracket.eliminated}</div>
          )
        ) : (
          <div className="mt-1 text-[11px] font-bold uppercase opacity-60">{S.rounds.names[revealed]}</div>
        )}
      </header>

      <ol key={revealed} className="ls-rise flex flex-1 flex-col justify-center gap-2">
        {[0, 1, 2, 3].map((i) => {
          const opp = opponents[i]

          // Round revelado → clicável (re-assistir).
          if (i < revealed) {
            const series = rounds[i]
            const won = series.winner === 'player'
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setView({ kind: 'series', round: i })}
                  className="flex min-h-11 w-full items-center gap-2 border-2 border-zinc-900 bg-white px-3 py-2 text-left shadow-[3px_3px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[3px_3px_0_0_#fafafa]"
                >
                  <span className="w-6 shrink-0 text-center text-lg">{won ? S.badges.emoji[i] : '⬜'}</span>
                  <span className="w-7 shrink-0 text-[11px] font-black uppercase">{S.rounds.tags[i]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{shortName(opp.name)}</span>
                    <span className="block text-[10px] opacity-60">{opp.season}</span>
                  </span>
                  <span className="shrink-0 font-mono font-black">
                    {series.gamesWon}-{series.gamesLost} {won ? '✓' : '✗'}
                  </span>
                </button>
              </li>
            )
          }

          // Round atual (a jogar) → escolha de ritmo.
          if (i === revealed && i < rounds.length) {
            return (
              <li key={i}>
                <div className="border-2 border-fuchsia-500 bg-white p-2 dark:bg-zinc-900">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="w-7 shrink-0 text-[11px] font-black uppercase">{S.rounds.tags[i]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black uppercase">{shortName(opp.name)}</span>
                      <span className="block text-[10px] opacity-60">{opp.season}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-bold uppercase text-fuchsia-600 dark:text-fuchsia-400">
                      {S.bracket.toPlay}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setView({ kind: 'playing', round: i, game: 0 })}
                      className="min-h-11 flex-1 border-2 border-zinc-900 bg-yellow-400 py-2 text-[11px] font-black uppercase text-zinc-900 dark:border-zinc-100"
                    >
                      {S.bracket.playByGame}
                    </button>
                    <button
                      type="button"
                      onClick={revealRound}
                      className="min-h-11 flex-1 border-2 border-zinc-900 bg-white py-2 text-[11px] font-black uppercase dark:border-zinc-100 dark:bg-zinc-900"
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
              <div className="flex min-h-11 w-full items-center gap-2 border-2 border-zinc-900 px-3 py-2 text-left opacity-50 dark:border-zinc-100">
                <span className="w-6 shrink-0 text-center text-lg">{S.bracket.hidden}</span>
                <span className="w-7 shrink-0 text-[11px] font-black uppercase">{S.rounds.tags[i]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{shortName(opp.name)}</span>
                  <span className="block text-[10px] opacity-60">{opp.season}</span>
                </span>
                <span className="shrink-0 opacity-50">—</span>
              </div>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
