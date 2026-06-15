import { useEffect, useState } from 'react'
import type { GameResult } from '../engine/types'
import { strings as S } from '../lib/strings'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

export function GameFeed({
  game,
  opponentName,
  gameNumber,
  totalGames,
  onNext,
  onBackToSeries,
  nextLabel = S.game.next,
  backLabel = S.game.backToSeries,
}: {
  game: GameResult
  opponentName: string
  gameNumber: number
  totalGames?: number
  onNext?: () => void
  onBackToSeries: () => void
  nextLabel?: string
  backLabel?: string
}) {
  const playerWon = game.homeScore > game.awayScore
  const topScorer = game.boxScore.reduce(
    (best, e) => (e.points > best.points ? e : best),
    game.boxScore[0],
  )
  const box = [...game.boxScore].sort((a, b) => b.points - a.points)

  // Revelação do placar: pequena suspense antes de mostrar quem venceu.
  const [revealed, setRevealed] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )
  useEffect(() => {
    if (revealed) return
    const id = setTimeout(() => setRevealed(true), 700)
    return () => clearTimeout(id)
  }, [revealed])

  const card = 'rounded-lg border border-line bg-surface shadow-sm'
  const sectionLabel = 'mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted'

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {totalGames !== undefined ? S.game.of(gameNumber, totalGames) : S.game.only(gameNumber)}
      </div>

      {/* Placar final (revelado com suspense) */}
      <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3 ${card}`}>
        <div className={revealed && !playerWon ? 'opacity-50' : ''}>
          <div className="text-[10px] font-semibold uppercase text-muted">{S.game.yourTeam}</div>
          <div className="font-display text-4xl font-bold leading-none text-accent">
            {revealed ? (
              <span className="ls-pop inline-block">{game.homeScore}</span>
            ) : (
              <span className="animate-pulse text-muted opacity-50">··</span>
            )}
          </div>
        </div>
        <div className="text-xs font-semibold text-muted">×</div>
        <div className={`text-right ${revealed && playerWon ? 'opacity-50' : ''}`}>
          <div className="truncate text-[10px] font-semibold uppercase text-muted">
            {shortName(opponentName)}
          </div>
          <div className="font-display text-4xl font-bold leading-none">
            {revealed ? (
              <span className="ls-pop inline-block">{game.awayScore}</span>
            ) : (
              <span className="animate-pulse text-muted opacity-50">··</span>
            )}
          </div>
        </div>
      </div>

      {/* Play-by-play */}
      <div>
        <h3 className={sectionLabel}>{S.game.plays}</h3>
        <ul className={`flex max-h-44 flex-col gap-0.5 overflow-y-auto p-2 ${card}`}>
          {game.playByPlay.map((line, i) => (
            <li key={i} className="font-mono text-[12px] leading-snug text-ink">
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Box score (só pontos) */}
      <div>
        <h3 className={sectionLabel}>
          {S.game.boxScore} · {S.game.yourTeam.toLowerCase()} {revealed ? game.homeScore : ''}
        </h3>
        <ul className={card}>
          {box.map((e) => (
            <li
              key={e.playerId}
              className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5 text-sm last:border-b-0"
            >
              <span className="truncate font-medium">
                {e.name}
                {e.playerId === topScorer.playerId ? ' ⭐' : ''}
              </span>
              <span className="font-mono font-semibold">{e.points}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Navegação */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBackToSeries}
          className="min-h-11 flex-1 rounded-lg border border-line bg-surface py-2 text-sm font-semibold transition hover:bg-surface2"
        >
          {backLabel}
        </button>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="min-h-11 flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-on-accent transition hover:brightness-95 active:brightness-90"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}
