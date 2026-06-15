import type { BracketTactics, Player, SeriesResult, SeriesTactics } from '../engine/types'
import { SCHEME_IDS } from '../lib/tactics'
import { strings as S } from '../lib/strings'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

interface Common {
  round: number
  tactics: BracketTactics
  fichas: number
  onTactic: (round: number, patch: Partial<SeriesTactics>) => void
}

/** Esquema da série + sexto homem — no card do round atual (antes de jogar). */
export function RoundTactics({
  round,
  tactics,
  fichas,
  sixthMan,
  onTactic,
}: Common & { sixthMan?: Player }) {
  const rt = tactics[round]
  const hasScheme = !!rt?.scheme
  const canScheme = hasScheme || fichas > 0
  const subbed = rt?.sixthManFromGame !== undefined

  return (
    <div className="mb-2 rounded-lg border border-line bg-surface2 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{S.tactics.scheme}</span>
        <span className="font-display text-[11px] font-bold text-accent">{S.tactics.fichas(fichas)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {SCHEME_IDS.map((id) => {
          const active = rt?.scheme === id
          return (
            <button
              key={id}
              type="button"
              disabled={!active && !canScheme}
              onClick={() => onTactic(round, { scheme: id })}
              title={S.tactics.schemeDesc[id]}
              className={[
                'rounded border px-1.5 py-1 text-[10px] font-semibold transition',
                active ? 'border-accent bg-accent-soft text-accent' : 'border-line',
                !active && !canScheme ? 'opacity-40' : 'hover:bg-surface',
              ].join(' ')}
            >
              {S.tactics.schemes[id]}
            </button>
          )
        })}
      </div>
      {sixthMan && (
        <div className="mt-1.5">
          {subbed ? (
            <span className="text-[10px] font-semibold text-pos">{S.tactics.subActive(shortName(sixthMan.name))}</span>
          ) : (
            <button
              type="button"
              disabled={fichas <= 0}
              onClick={() => onTactic(round, { sixthManFromGame: 1 })}
              className={[
                'rounded border border-line px-1.5 py-1 text-[10px] font-semibold transition',
                fichas <= 0 ? 'opacity-40' : 'hover:bg-surface',
              ].join(' ')}
            >
              {S.tactics.sub}: {shortName(sixthMan.name)} ({S.tactics.cost})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Timeout + takeover — na tela jogo-a-jogo, quando está atrás na série. */
export function ComebackTactics({
  round,
  game,
  series,
  tactics,
  fichas,
  takeoverDone,
  onTactic,
}: Common & { game: number; series: SeriesResult; takeoverDone: boolean }) {
  let pw = 0
  let ow = 0
  for (let k = 0; k <= game && k < series.games.length; k++) {
    const g = series.games[k]
    if (g.homeScore > g.awayScore) pw++
    else ow++
  }
  const decided = pw >= 4 || ow >= 4
  const down = ow > pw
  const rt = tactics[round]
  const usedTimeout = rt?.timeoutFromGame !== undefined
  const usedTakeover = rt?.takeoverGame !== undefined
  if (decided || (!down && !usedTimeout && !usedTakeover)) return null

  const nextGame = game + 2
  const timeoutAvail = down && !usedTimeout && fichas > 0
  const takeoverAvail = down && !usedTakeover && !takeoverDone && fichas > 0

  return (
    <div className="rounded-lg border border-line bg-surface2 p-2">
      {down && <div className="mb-1 text-[11px] font-semibold text-neg">{S.tactics.down}</div>}
      <div className="flex flex-wrap items-center gap-1.5">
        {timeoutAvail && (
          <button
            type="button"
            onClick={() => onTactic(round, { timeoutFromGame: nextGame })}
            title={S.tactics.timeoutHint}
            className="rounded-lg border border-accent bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent transition hover:brightness-95"
          >
            {S.tactics.timeout} ({S.tactics.cost})
          </button>
        )}
        {takeoverAvail && (
          <button
            type="button"
            onClick={() => onTactic(round, { takeoverGame: nextGame })}
            title={S.tactics.takeoverHint}
            className="rounded-lg border border-accent bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent transition hover:brightness-95"
          >
            {S.tactics.takeover} ({S.tactics.cost})
          </button>
        )}
        {usedTimeout && <span className="text-[10px] font-semibold text-pos">{S.tactics.timeout} ✓</span>}
        {usedTakeover && <span className="text-[10px] font-semibold text-pos">{S.tactics.takeover} ✓</span>}
        <span className="font-display ml-auto text-[11px] font-bold text-accent">{S.tactics.fichas(fichas)}</span>
      </div>
    </div>
  )
}
