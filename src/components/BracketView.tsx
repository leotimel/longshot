import { useState } from 'react'
import type { BracketResult, HistoricalTeam } from '../engine/types'
import { GameFeed } from './GameFeed'

const ROUND_NAMES = ['First Round', 'Second Round', 'Conf. Finals', 'Finais']
const ROUND_TAGS = ['1R', '2R', 'CF', 'F']
const ROUND_BADGES = ['🥉', '🥈', '🥇', '🏆']
const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

const SHELL =
  'mx-auto flex min-h-svh max-w-md flex-col gap-3 bg-zinc-100 p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50'

type View =
  | { kind: 'bracket' }
  | { kind: 'series'; round: number }
  | { kind: 'game'; round: number; game: number }

export function BracketView({
  bracket,
  opponents,
  onExit,
  onOpenStats,
  onOpenHelp,
}: {
  bracket: BracketResult
  opponents: HistoricalTeam[]
  onExit?: () => void
  onOpenStats?: () => void
  onOpenHelp?: () => void
}) {
  const [view, setView] = useState<View>({ kind: 'bracket' })
  const { rounds, champion } = bracket
  const roundsWon = rounds.filter((s) => s.winner === 'player').length
  const dayBadge = roundsWon > 0 ? ROUND_BADGES[roundsWon - 1] : null

  // ── Jogo ──────────────────────────────────────────────────────────────────
  if (view.kind === 'game') {
    const series = rounds[view.round]
    return (
      <main className={SHELL}>
        <header className="flex items-baseline justify-between gap-2">
          <h1 className="text-lg font-black uppercase italic">{ROUND_NAMES[view.round]}</h1>
          <span className="truncate text-[11px] font-bold opacity-70">
            vs {shortName(opponents[view.round].name)}
          </span>
        </header>
        <GameFeed
          key={`${view.round}-${view.game}`}
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

  // ── Resumo da série ────────────────────────────────────────────────────────
  if (view.kind === 'series') {
    const series = rounds[view.round]
    const opp = opponents[view.round]
    const won = series.winner === 'player'
    return (
      <main className={SHELL}>
        <header>
          <button
            type="button"
            onClick={() => setView({ kind: 'bracket' })}
            className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-wide opacity-80"
          >
            ← Bracket
          </button>
          <h1 className="mt-1 text-xl font-black uppercase italic">{ROUND_NAMES[view.round]}</h1>
          <div className="text-sm font-bold">
            vs {opp.name} <span className="opacity-60">{opp.season}</span>
          </div>
          <div className="mt-1 text-2xl font-black">
            {series.gamesWon}
            <span className="opacity-40">-</span>
            {series.gamesLost}{' '}
            <span className={`text-sm ${won ? 'text-teal-600 dark:text-teal-400' : 'text-fuchsia-600 dark:text-fuchsia-400'}`}>
              {won ? 'venceu ✓' : 'perdeu ✗'}
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
                  <span className="text-sm uppercase">Jogo {i + 1}</span>
                  <span className="font-mono">
                    {g.homeScore}-{g.awayScore}{' '}
                    <span className={gWon ? 'text-teal-600 dark:text-teal-400' : 'text-fuchsia-600 dark:text-fuchsia-400'}>
                      {gWon ? 'V' : 'D'}
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

  // ── Bracket (4 rodadas) ─────────────────────────────────────────────────────
  return (
    <main className={SHELL}>
      <header className="relative text-center">
        <div className="absolute right-0 top-0 flex gap-1">
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              aria-label="Como jogar"
              className="border-2 border-zinc-900 min-h-11 min-w-11 inline-flex items-center justify-center px-2 py-1 text-lg font-black leading-none dark:border-zinc-100"
            >
              ?
            </button>
          )}
          {onOpenStats && (
            <button
              type="button"
              onClick={onOpenStats}
              aria-label="Estatísticas"
              className="border-2 border-zinc-900 min-h-11 min-w-11 inline-flex items-center justify-center px-2 py-1 text-lg leading-none dark:border-zinc-100"
            >
              📊
            </button>
          )}
        </div>
        <h1 className="text-2xl font-black uppercase italic">Seu Playoff</h1>
        {champion ? (
          <div className="mt-1 border-2 border-zinc-900 bg-yellow-400 py-2 text-lg font-black uppercase text-zinc-900 dark:border-zinc-100">
            🏆 Campeão!
          </div>
        ) : dayBadge ? (
          <div className="mt-1 text-lg font-black">
            {dayBadge} {ROUND_NAMES[roundsWon - 1]}
          </div>
        ) : (
          <div className="mt-1 text-sm font-bold opacity-70">Eliminado no First Round</div>
        )}
      </header>

      <ol className="flex flex-1 flex-col justify-center gap-2">
        {[0, 1, 2, 3].map((i) => {
          const series = i < rounds.length ? rounds[i] : null
          const won = series?.winner === 'player'
          const opp = opponents[i]
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!series}
                onClick={() => series && setView({ kind: 'series', round: i })}
                className={[
                  'flex min-h-11 w-full items-center gap-2 border-2 border-zinc-900 px-3 py-2 text-left dark:border-zinc-100',
                  series
                    ? 'bg-white shadow-[3px_3px_0_0_#18181b] dark:bg-zinc-900 dark:shadow-[3px_3px_0_0_#fafafa]'
                    : 'opacity-50',
                ].join(' ')}
              >
                <span className="w-6 shrink-0 text-center text-lg">
                  {series ? (won ? ROUND_BADGES[i] : '⬜') : '🔒'}
                </span>
                <span className="w-7 shrink-0 text-[11px] font-black uppercase">{ROUND_TAGS[i]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{shortName(opp.name)}</span>
                  <span className="block text-[10px] opacity-60">{opp.season}</span>
                </span>
                {series ? (
                  <span className="shrink-0 font-mono font-black">
                    {series.gamesWon}-{series.gamesLost} {won ? '✓' : '✗'}
                  </span>
                ) : (
                  <span className="shrink-0 opacity-50">—</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="border-2 border-zinc-900 bg-white py-2 text-sm font-black uppercase dark:border-zinc-100 dark:bg-zinc-900"
        >
          Voltar ao draft
        </button>
      )}
    </main>
  )
}
