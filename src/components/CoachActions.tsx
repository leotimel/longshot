import type { ReactNode } from 'react'
import type { BracketTactics, Player, SeriesResult, SeriesTactics } from '../engine/types'
import { SCHEME_IDS } from '../lib/tactics'
import { teamTraits } from '../lib/scouting'
import { strings as S } from '../lib/strings'
import { TraitChips } from './TeamStats'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

interface Common {
  round: number
  tactics: BracketTactics
  fichas: number
  onTactic: (round: number, patch: Partial<SeriesTactics>) => void
  onHelp?: () => void
}

function HelpRow({ left, fichas, onHelp }: { left: ReactNode; fichas: number; onHelp?: () => void }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      {left}
      <span className="flex items-center gap-2">
        <span className="font-display text-[11px] font-bold text-accent">{S.tactics.fichas(fichas)}</span>
        {onHelp && (
          <button type="button" onClick={onHelp} aria-label={S.tactics.help} className="text-[11px] text-muted underline">
            ⓘ {S.tactics.help}
          </button>
        )}
      </span>
    </div>
  )
}

/** Esquema da série + sexto homem — no card do round atual (antes de jogar). */
export function RoundTactics({
  round,
  tactics,
  fichas,
  sixthMan,
  team,
  onTactic,
  onHelp,
}: Common & { sixthMan?: Player; team?: Player[] }) {
  const rt = tactics[round]
  const hasScheme = !!rt?.scheme
  const canScheme = hasScheme || fichas > 0
  const subbed = rt?.sixthManFromGame !== undefined
  const yours = team ? teamTraits(team) : []

  return (
    <div className="mb-2 rounded-lg border border-line bg-surface2 p-2">
      <HelpRow
        left={<span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{S.tactics.prepare}</span>}
        fichas={fichas}
        onHelp={onHelp}
      />

      {yours.length > 0 && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-semibold uppercase text-muted">{S.tactics.yourTraits}</span>
          <TraitChips traits={yours} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-1">
        {SCHEME_IDS.map((id) => {
          const active = rt?.scheme === id
          const disabled = !active && !canScheme
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onTactic(round, { scheme: id })}
              className={[
                'rounded border px-1.5 py-1 text-left transition',
                active ? 'border-accent bg-accent-soft' : 'border-line',
                disabled ? 'opacity-40' : 'hover:bg-surface',
              ].join(' ')}
            >
              <span className="block text-[11px] font-semibold leading-tight">{S.tactics.schemes[id]}</span>
              <span className="block text-[9px] leading-tight text-muted">{S.tactics.schemeDesc[id]}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-1 text-[9px] text-muted">
        {S.tactics.scheme}: {S.tactics.costToken}
        {!canScheme ? ` · ${S.tactics.noTokens}` : ''}
      </div>

      <div className="mt-1.5 border-t border-line pt-1.5">
        {!sixthMan ? (
          <span className="text-[10px] text-muted">
            {S.tactics.sub}: {S.tactics.noSixth}
          </span>
        ) : subbed ? (
          <span className="text-[10px] font-semibold text-pos">{S.tactics.subActive(shortName(sixthMan.name))}</span>
        ) : (
          <>
            <button
              type="button"
              disabled={fichas <= 0}
              onClick={() => onTactic(round, { sixthManFromGame: 1 })}
              className={[
                'rounded border border-line px-1.5 py-1 text-[10px] font-semibold transition',
                fichas <= 0 ? 'opacity-40' : 'hover:bg-surface',
              ].join(' ')}
            >
              {S.tactics.sub}: {shortName(sixthMan.name)} · {S.tactics.costToken}
            </button>
            <div className="mt-0.5 text-[9px] text-muted">
              {S.tactics.subHint}
              {fichas <= 0 ? ` · ${S.tactics.noTokens}` : ''}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Timeout + takeover — na tela jogo-a-jogo. Sempre visível; só ativável quando atrás. */
export function ComebackTactics({
  round,
  game,
  series,
  tactics,
  fichas,
  takeoverDone,
  onTactic,
  onHelp,
}: Common & { game: number; series: SeriesResult; takeoverDone: boolean }) {
  let pw = 0
  let ow = 0
  for (let k = 0; k <= game && k < series.games.length; k++) {
    const g = series.games[k]
    if (g.homeScore > g.awayScore) pw++
    else ow++
  }
  if (pw >= 4 || ow >= 4) return null // série decidida

  const down = ow > pw
  const rt = tactics[round]
  const usedTimeout = rt?.timeoutFromGame !== undefined
  const usedTakeover = rt?.takeoverGame !== undefined
  const nextGame = game + 2
  const timeoutAvail = down && !usedTimeout && fichas > 0
  const takeoverAvail = down && !usedTakeover && !takeoverDone && fichas > 0

  return (
    <div className="rounded-lg border border-line bg-surface2 p-2">
      <HelpRow
        left={
          <span className={`text-[11px] font-semibold ${down ? 'text-neg' : 'text-muted'}`}>
            {down ? S.tactics.down(pw, ow) : S.tactics.fichasLabel}
          </span>
        }
        fichas={fichas}
        onHelp={onHelp}
      />

      {down ? (
        <div className="flex flex-col gap-1.5">
          <div>
            <button
              type="button"
              disabled={!timeoutAvail}
              onClick={() => onTactic(round, { timeoutFromGame: nextGame })}
              className={[
                'w-full rounded-lg border px-2 py-1 text-left text-[11px] font-semibold transition',
                usedTimeout
                  ? 'border-pos text-pos'
                  : timeoutAvail
                    ? 'border-accent bg-accent-soft text-accent hover:brightness-95'
                    : 'border-line opacity-50',
              ].join(' ')}
            >
              {S.tactics.timeout}
              {usedTimeout ? ' ✓' : ` · ${S.tactics.costToken}`}
            </button>
            <div className="mt-0.5 text-[9px] text-muted">
              {S.tactics.timeoutHint}
              {!timeoutAvail && !usedTimeout && fichas <= 0 ? ` · ${S.tactics.noTokens}` : ''}
            </div>
          </div>
          <div>
            <button
              type="button"
              disabled={!takeoverAvail}
              onClick={() => onTactic(round, { takeoverGame: nextGame })}
              className={[
                'w-full rounded-lg border px-2 py-1 text-left text-[11px] font-semibold transition',
                usedTakeover
                  ? 'border-pos text-pos'
                  : takeoverAvail
                    ? 'border-accent bg-accent-soft text-accent hover:brightness-95'
                    : 'border-line opacity-50',
              ].join(' ')}
            >
              {S.tactics.takeover}
              {usedTakeover ? ' ✓' : ` · ${S.tactics.costToken}`}
            </button>
            <div className="mt-0.5 text-[9px] text-muted">{S.tactics.takeoverHint}</div>
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-muted">{S.tactics.reactWhen}</div>
      )}
    </div>
  )
}
