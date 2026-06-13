import type { GameResult } from '../engine/types'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

export function GameFeed({
  game,
  opponentName,
  gameNumber,
  totalGames,
  onNext,
  onBackToSeries,
}: {
  game: GameResult
  opponentName: string
  gameNumber: number
  totalGames: number
  onNext?: () => void
  onBackToSeries: () => void
}) {
  const playerWon = game.homeScore > game.awayScore
  const topScorer = game.boxScore.reduce(
    (best, e) => (e.points > best.points ? e : best),
    game.boxScore[0],
  )
  const box = [...game.boxScore].sort((a, b) => b.points - a.points)

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">
        Jogo {gameNumber} de {totalGames}
      </div>

      {/* Placar final */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900">
        <div className={playerWon ? '' : 'opacity-50'}>
          <div className="text-[10px] font-black uppercase">Seu time</div>
          <div className="text-3xl font-black leading-none text-fuchsia-600 dark:text-fuchsia-400">
            {game.homeScore}
          </div>
        </div>
        <div className="text-xs font-black opacity-50">×</div>
        <div className={`text-right ${playerWon ? 'opacity-50' : ''}`}>
          <div className="truncate text-[10px] font-black uppercase">{shortName(opponentName)}</div>
          <div className="text-3xl font-black leading-none">{game.awayScore}</div>
        </div>
      </div>

      {/* Play-by-play */}
      <div>
        <h3 className="mb-1 text-[11px] font-black uppercase tracking-wide opacity-70">Lances</h3>
        <ul className="flex max-h-44 flex-col gap-0.5 overflow-y-auto border-2 border-zinc-900 bg-white p-2 dark:border-zinc-100 dark:bg-zinc-900">
          {game.playByPlay.map((line, i) => (
            <li key={i} className="font-mono text-[12px] leading-snug">
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Box score (só pontos) */}
      <div>
        <h3 className="mb-1 text-[11px] font-black uppercase tracking-wide opacity-70">
          Box score · seu time {game.homeScore}
        </h3>
        <ul className="border-2 border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900">
          {box.map((e) => (
            <li
              key={e.playerId}
              className="flex items-center justify-between gap-2 border-b border-zinc-200 px-2 py-1 text-sm last:border-b-0 dark:border-zinc-700"
            >
              <span className="truncate font-bold">
                {e.name}
                {e.playerId === topScorer.playerId ? ' ⭐' : ''}
              </span>
              <span className="font-mono font-black">{e.points}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Navegação */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBackToSeries}
          className="flex-1 border-2 border-zinc-900 bg-white py-2 text-sm font-black uppercase dark:border-zinc-100 dark:bg-zinc-900"
        >
          Ver Série
        </button>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="flex-1 border-2 border-zinc-900 bg-yellow-400 py-2 text-sm font-black uppercase text-zinc-900 shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:shadow-[3px_3px_0_0_#fafafa]"
          >
            Próximo Jogo →
          </button>
        )}
      </div>
    </div>
  )
}
