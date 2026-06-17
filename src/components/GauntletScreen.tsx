import { useMemo, useState } from 'react'
import type { Player, SeriesResult } from '../engine/types'
import type { Bracket, DailyDraft } from '../engine/draft'
import { dailyDraft } from '../engine/draft'
import { endlessOpponent, simulateGauntletRound } from '../engine/endless'
import { campaignStats } from '../lib/playerStats'
import { getGauntletRecord, setGauntletRecord } from '../lib/storage'
import { playUnlock } from '../lib/sound'
import { celebrate } from '../lib/confetti'
import { strings as S } from '../lib/strings'
import { DraftScreen } from './DraftScreen'
import { TeamStats } from './TeamStats'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name
const newSeed = (): number => Math.floor(Math.random() * 1_000_000_000)

/** Cestinha (maior pontuador total) de uma série. */
function seriesMvp(series: SeriesResult): { name: string; points: number } | null {
  const cs = campaignStats({ rounds: [series], champion: false })
  if (!cs.mvpId) return null
  const p = cs.byPlayer.get(cs.mvpId)
  return p ? { name: p.name, points: p.points } : null
}

/**
 * Gauntlet infinito — modo livre, autocontido. Drafta um quinteto (times
 * aleatórios da sessão), enfrenta séries melhor-de-3 cada vez mais difíceis e
 * registra o recorde de rodadas vencidas. Não toca no diário/streak/stats.
 */
export function GauntletScreen({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(newSeed)
  const [phase, setPhase] = useState<'draft' | 'climb'>('draft')
  const [team, setTeam] = useState<Player[]>([])
  const [round, setRound] = useState(0) // rodada atual (0-based)
  const [cleared, setCleared] = useState(0) // rodadas vencidas nesta run
  const [record, setRecord] = useState(getGauntletRecord)
  const [series, setSeries] = useState<SeriesResult | null>(null) // resultado da rodada
  const [over, setOver] = useState(false)
  const [isRecord, setIsRecord] = useState(false)

  // Draft da sessão: times sorteados pela seed; o "caminho" mostra os 1ºs adversários.
  const draft: DailyDraft = useMemo(
    () => ({
      date: `gauntlet-${seed}`,
      draftTeams: dailyDraft(`gauntlet-${seed}`).draftTeams,
      bracket: [0, 1, 2, 3].map((r) => endlessOpponent(seed, r)) as Bracket,
    }),
    [seed],
  )

  const opponent = useMemo(() => endlessOpponent(seed, round), [seed, round])
  const mvp = useMemo(() => (series ? seriesMvp(series) : null), [series])

  const startRun = (picked: Player[]) => {
    setTeam(picked)
    setRound(0)
    setCleared(0)
    setSeries(null)
    setOver(false)
    setIsRecord(false)
    setPhase('climb')
  }

  const playRound = () => {
    const result = simulateGauntletRound(team, seed, round)
    setSeries(result)
    if (result.winner === 'player') {
      playUnlock()
      celebrate(false)
      return
    }
    // Derrota → fim da run.
    const beat = cleared > record
    setRecord(setGauntletRecord(cleared))
    setIsRecord(beat)
    setOver(true)
    if (beat) {
      playUnlock()
      celebrate(true)
    }
  }

  const advance = () => {
    setCleared((c) => c + 1)
    setRound((r) => r + 1)
    setSeries(null)
  }

  const restart = () => {
    setSeed(newSeed())
    setPhase('draft')
    setSeries(null)
    setOver(false)
  }

  if (phase === 'draft') {
    return (
      <DraftScreen
        draft={draft}
        onStartPlayoff={(picked) => startRun(picked)}
        onExit={onExit}
        skipSixthMan
        startLabel={S.gauntlet.start}
        startNote={S.gauntlet.startNote}
        pathTitle={S.gauntlet.pathTitle}
        pathTags={S.gauntlet.pathTags}
      />
    )
  }

  const won = series?.winner === 'player'
  const statCard = 'rounded-lg border border-line p-2 text-center'
  const statLabel = 'text-[10px] font-medium uppercase tracking-wide text-muted'

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-3 bg-canvas p-3 text-ink">
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onExit}
          className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold transition hover:bg-surface2"
        >
          {S.gauntlet.exit}
        </button>
        <h1 className="font-display text-xl font-bold uppercase tracking-wide">{S.gauntlet.title}</h1>
        <div className="min-h-11 rounded-lg border border-line px-3 py-1 text-center">
          <div className="font-display text-base font-bold leading-none text-accent">🏆 {record}</div>
          <div className="text-[9px] uppercase tracking-wide text-muted">{S.gauntlet.record}</div>
        </div>
      </header>

      {/* Progresso da run */}
      <div className="grid grid-cols-2 gap-2">
        <div className={statCard}>
          <div className="font-display text-2xl font-bold text-accent">{S.gauntlet.round(round + 1)}</div>
          <div className={statLabel}>{S.gauntlet.bestOf3}</div>
        </div>
        <div className={statCard}>
          <div className="font-display text-2xl font-bold">{cleared}</div>
          <div className={statLabel}>{S.gauntlet.survived(cleared).toLowerCase()}</div>
        </div>
      </div>

      {/* Rodada pronta para jogar */}
      {!series && !over && (
        <section className="flex flex-1 flex-col gap-3">
          <div>
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {S.gauntlet.opponent}
            </h2>
            <TeamStats team={opponent} title={`${opponent.name} ${opponent.season}`} />
          </div>
          <button
            type="button"
            onClick={playRound}
            className="font-display mt-auto rounded-lg bg-accent py-3 text-lg font-bold uppercase tracking-wide text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90"
          >
            {S.gauntlet.play}
          </button>
        </section>
      )}

      {/* Resultado da série (vitória ou derrota) */}
      {series && (
        <section className="flex flex-1 flex-col gap-3">
          <div
            className={[
              'rounded-lg p-3 text-center',
              won ? 'bg-accent-soft' : 'border border-line bg-surface',
            ].join(' ')}
          >
            <div className={`font-display text-lg font-bold uppercase tracking-wide ${won ? 'text-accent' : 'text-muted'}`}>
              {won ? S.gauntlet.won : S.gauntlet.lost}
            </div>
            <div className="mt-1 text-sm font-medium">
              {opponent.name} {opponent.season}
            </div>
            <div className="font-display mt-1 text-2xl font-bold tabular-nums">
              {series.gamesWon}–{series.gamesLost}
            </div>
            {/* Placar jogo a jogo */}
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {series.games.map((g, i) => {
                const w = g.homeScore > g.awayScore
                return (
                  <span
                    key={i}
                    className={[
                      'rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
                      w ? 'bg-pos-soft text-pos' : 'bg-surface2 text-muted',
                    ].join(' ')}
                  >
                    {g.homeScore}-{g.awayScore}
                  </span>
                )
              })}
            </div>
            {mvp && (
              <div className="mt-2 text-[11px] text-muted">
                {S.gauntlet.seriesMvp}: <span className="font-semibold text-ink">{shortName(mvp.name)}</span>{' '}
                <span className="font-mono tabular-nums">{mvp.points} pts</span>
              </div>
            )}
          </div>

          {won && !over && (
            <button
              type="button"
              onClick={advance}
              className="font-display mt-auto rounded-lg bg-accent py-3 text-lg font-bold uppercase tracking-wide text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90"
            >
              {S.gauntlet.advance}
            </button>
          )}

          {over && (
            <div className="mt-auto flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 text-center">
              <div className="font-display text-lg font-bold uppercase tracking-wide">{S.gauntlet.overTitle}</div>
              {isRecord && (
                <div className="ls-celebrate rounded-lg bg-accent px-3 py-1 text-sm font-bold uppercase tracking-wide text-on-accent">
                  {S.gauntlet.newRecord}
                </div>
              )}
              <div className="text-sm font-medium">{S.gauntlet.survived(cleared)}</div>
              <div className="text-[11px] text-muted">
                {S.gauntlet.record}: <span className="font-mono font-semibold text-ink">{record}</span>
              </div>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={restart}
                  className="flex-1 rounded-lg bg-accent py-2.5 font-semibold text-on-accent shadow-sm transition hover:brightness-95"
                >
                  {S.gauntlet.again}
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 rounded-lg border border-line bg-surface py-2.5 font-semibold transition hover:bg-surface2"
                >
                  {S.gauntlet.exit}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
