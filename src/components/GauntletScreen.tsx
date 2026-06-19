import { useMemo, useState } from 'react'
import type { Player, Position, SeriesResult } from '../engine/types'
import { POSITIONS } from '../engine/types'
import type { Bracket, DailyDraft } from '../engine/draft'
import { dailyDraft } from '../engine/draft'
import { ROSTERS } from '../engine/data/rosters'
import { endlessOpponent, gauntletOpponent, simulateGauntletRound } from '../engine/endless'
import { campaignStats, overall } from '../lib/playerStats'
import {
  getGauntletProfile,
  getGauntletStats,
  recordGauntletMeta,
  recordGauntletRun,
  setGauntletCaptain,
  setGauntletIntensity,
  type GauntletProfile,
  type GauntletStats,
} from '../lib/storage'
import { CAPTAIN_CHALLENGES, CAPTAIN_UNLOCK, captainPerks, isChallengeDone } from '../lib/gauntletCaptain'
import { initBuild, offerBoons, SHIELD_CAP, type Boon, type RunBuild } from '../lib/gauntletBoons'
import {
  DEFAULT_CONFIG,
  INTENSITY_NAMES,
  gauntletAscension,
  isEventRound,
  roundPlan,
  type RunConfig,
} from '../lib/gauntletRun'
import { buildGauntletShare, shareText } from '../lib/share'
import { playUnlock } from '../lib/sound'
import { celebrate } from '../lib/confetti'
import { strings as S } from '../lib/strings'
import { DraftScreen } from './DraftScreen'
import { TeamStats } from './TeamStats'

type MutKey = 'noShields' | 'blitz' | 'doubleBoss' | 'attackOnly'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name
const newSeed = (): number => Math.floor(Math.random() * 1_000_000_000)
const addShields = (s: RunBuild, n: number): RunBuild => ({ ...s, shields: Math.min(SHIELD_CAP, s.shields + n) })

/** Cestinha (maior pontuador total) de uma série. */
function seriesMvp(series: SeriesResult): { name: string; points: number } | null {
  const cs = campaignStats({ rounds: [series], champion: false })
  if (!cs.mvpId) return null
  const p = cs.byPlayer.get(cs.mvpId)
  return p ? { name: p.name, points: p.points } : null
}

/** Maior pontuação do capitão (por id) num jogo da série. */
function captainBestInSeries(series: SeriesResult, captainId: string): number {
  let best = 0
  for (const g of series.games) {
    for (const e of g.boxScore) if (e.playerId === captainId && e.points > best) best = e.points
  }
  return best
}

/** Candidatos a capitão: 1 entrada por jogador (a de maior overall), por posição. */
function captainPool(): Player[] {
  const byName = new Map<string, Player>()
  for (const p of Object.values(ROSTERS).flat()) {
    const cur = byName.get(p.name)
    if (!cur || overall(p) > overall(cur)) byName.set(p.name, p)
  }
  return [...byName.values()].sort((a, b) => overall(b) - overall(a))
}

/**
 * Gauntlet infinito — modo livre, autocontido. Drafta um quinteto, escolhe boons
 * (roguelike) entre rodadas, encara rodadas-chefe (a cada 5), modificadores e eventos,
 * e sobe de ASCENSÃO ao bater o recorde (dificuldade permanente). Não toca no diário.
 */
export function GauntletScreen({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(newSeed)
  const [phase, setPhase] = useState<'setup' | 'draft' | 'climb'>('setup')
  const [config, setConfig] = useState<RunConfig>(() => ({ ...DEFAULT_CONFIG, intensity: getGauntletProfile().intensity }))
  const [seedInput, setSeedInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [build, setBuild] = useState<RunBuild>(() => initBuild([]))
  const [round, setRound] = useState(0)
  const [cleared, setCleared] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [bet, setBet] = useState(false)
  const [stats, setStats] = useState<GauntletStats>(getGauntletStats)
  const [series, setSeries] = useState<SeriesResult | null>(null)
  const [offer, setOffer] = useState<Boon[] | null>(null)
  const [eventActive, setEventActive] = useState(false)
  const [activeBoons, setActiveBoons] = useState<Boon[]>([])
  const [over, setOver] = useState(false)
  const [isRecord, setIsRecord] = useState(false)
  const [shieldNote, setShieldNote] = useState(false)
  // Capitão (meta-progressão) + rastreio da run atual.
  const [profile, setProfile] = useState<GauntletProfile>(getGauntletProfile)
  const [picking, setPicking] = useState(false)
  const [pickPos, setPickPos] = useState<Position>('PG')
  const [capBoss, setCapBoss] = useState(0)
  const [capBest, setCapBest] = useState(0)

  const captain = profile.captain
  const perks = useMemo(() => (captain ? captainPerks(captain) : null), [captain])
  const captainUnlocked = profile.bestRanked >= CAPTAIN_UNLOCK
  const captainList = useMemo(() => captainPool(), [])

  // Ascensão (fixa na run) derivada do recorde; o "caminho" mostra os 1ºs adversários.
  const ascension = useMemo(() => gauntletAscension(stats.best), [stats.best])
  const draft: DailyDraft = useMemo(
    () => ({
      date: `gauntlet-${seed}`,
      draftTeams: dailyDraft(`gauntlet-${seed}`).draftTeams,
      bracket: [0, 1, 2, 3].map((r) => endlessOpponent(seed, r)) as Bracket,
    }),
    [seed],
  )
  const pool = useMemo<Player[]>(() => draft.draftTeams.flatMap((t) => t.roster), [draft])

  const plan = useMemo(() => roundPlan(seed, round, ascension, config, bet), [seed, round, ascension, config, bet])
  const opponent = useMemo(() => gauntletOpponent(seed, round, plan.opponentBump), [seed, round, plan])
  const mvp = useMemo(() => (series ? seriesMvp(series) : null), [series])

  const startRun = (picked: Player[]) => {
    // Largada com os perks do capitão (acerto da run + escudos), respeitando "sem escudos".
    const base = initBuild(picked)
    setBuild({
      ...base,
      boost: perks?.boost ?? {},
      shields: config.noShields ? 0 : perks?.startShields ?? 0,
    })
    setRound(0)
    setCleared(0)
    setAttempt(0)
    setBet(false)
    setCapBoss(0)
    setCapBest(0)
    setSeries(null)
    setOffer(null)
    setEventActive(false)
    setActiveBoons([])
    setOver(false)
    setIsRecord(false)
    setShieldNote(false)
    setPhase('climb')
  }

  const playRound = () => {
    setShieldNote(false)
    const result = simulateGauntletRound(build.team, seed, round, {
      boost: build.boost,
      modifier: plan.modifier?.adjust,
      opponentBump: plan.opponentBump,
      wins: plan.wins,
      attempt,
    })
    setSeries(result)

    // Rastreio do capitão (vale na vitória ou na derrota — um jogão conta sempre).
    if (captain) {
      setCapBest((x) => Math.max(x, captainBestInSeries(result, captain.id)))
      if (result.winner === 'player' && plan.isBoss) setCapBoss((x) => x + 1)
    }

    if (result.winner === 'player') {
      playUnlock()
      celebrate(plan.isBoss)
      // Recompensas em escudo: chefe (+1) e aposta vencida (+2) — nada no modo "sem escudos".
      let bonus = config.noShields ? 0 : plan.isBoss ? 1 : 0
      if (bet) {
        if (!config.noShields) bonus += 2
        setBet(false)
      }
      const nb = bonus > 0 ? addShields(build, bonus) : build
      if (bonus > 0) setBuild(nb)
      // Evento (descanso/aposta) ou oferta de boon. Sem eventos no modo "sem escudos".
      if (!config.noShields && isEventRound(seed, round, config)) setEventActive(true)
      else setOffer(offerBoons(seed, round, nb, pool, config))
      return
    }

    if (build.shields > 0) return // derrota, mas pode gastar escudo (retry)
    // Sem escudo → fim da run.
    const beat = cleared > stats.best
    setStats(recordGauntletRun(cleared))
    // Meta: recorde qualificado (Padrão+) e progresso do capitão (inclui o jogão da derrota).
    if (captain || config.intensity >= 1) {
      const finalBest = captain ? Math.max(capBest, captainBestInSeries(result, captain.id)) : 0
      setProfile(
        recordGauntletMeta({
          cleared,
          intensity: config.intensity,
          captain: captain ? { bossWins: capBoss, bestGame: finalBest } : null,
        }),
      )
    }
    setIsRecord(beat)
    setOver(true)
    setBet(false)
    if (beat) {
      playUnlock()
      celebrate(true)
    }
  }

  const advance = () => {
    setCleared((c) => c + 1)
    setRound((r) => r + 1)
    setAttempt(0)
    setSeries(null)
    setOffer(null)
    setEventActive(false)
  }

  const pickBoon = (boon: Boon) => {
    setBuild((b) => boon.apply(b, pool))
    setActiveBoons((a) => [...a, boon])
    advance()
  }

  const chooseRest = () => {
    setBuild((b) => addShields(b, 2))
    advance()
  }
  const chooseBet = () => {
    setBet(true)
    advance()
  }

  const useShield = () => {
    setBuild((b) => ({ ...b, shields: b.shields - 1 }))
    setAttempt((a) => a + 1)
    setSeries(null)
    setShieldNote(true)
  }

  const restart = () => {
    setSeed(newSeed())
    setSeedInput('')
    setCopied(false)
    setPhase('setup')
    setSeries(null)
    setOffer(null)
    setEventActive(false)
    setOver(false)
    setBet(false)
  }

  const seedCode = seed.toString(36)
  const handleShare = () => void shareText(buildGauntletShare(cleared, stats.best, config, seedCode))

  const rerollSeed = () => {
    setSeed(newSeed())
    setSeedInput('')
    setCopied(false)
  }
  const copyCode = () => {
    try {
      void navigator.clipboard?.writeText(seedCode)
      setCopied(true)
    } catch {
      // sem clipboard
    }
  }
  const toggleMut = (key: MutKey) => setConfig((c) => ({ ...c, [key]: !c[key] }))
  const begin = () => {
    setGauntletIntensity(config.intensity)
    const code = seedInput.trim()
    if (code) {
      const parsed = parseInt(code, 36)
      if (Number.isFinite(parsed) && parsed > 0) setSeed(parsed)
    }
    setPhase('draft')
  }
  const pickCaptain = (id: string) => {
    setProfile(setGauntletCaptain(id))
    setPicking(false)
  }

  if (phase === 'setup') {
    const chip = (active: boolean) =>
      [
        'min-h-11 rounded-lg border px-3 py-1.5 text-sm font-semibold transition',
        active ? 'border-accent bg-accent-soft text-accent' : 'border-line hover:bg-surface2',
      ].join(' ')

    // Escolha do capitão (escolha única).
    if (picking) {
      return (
        <main className="mx-auto flex h-svh max-w-md flex-col gap-3 bg-canvas p-3 text-ink">
          <header className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold transition hover:bg-surface2"
            >
              {S.gauntlet.back}
            </button>
            <h1 className="font-display text-base font-bold uppercase tracking-wide">{S.gauntlet.captainPickTitle}</h1>
            <span className="w-11" />
          </header>
          <div className="grid grid-cols-5 gap-1">
            {POSITIONS.map((pos) => (
              <button key={pos} type="button" onClick={() => setPickPos(pos)} className={`min-h-11 rounded-lg border text-sm font-bold ${chip(pickPos === pos)}`}>
                {pos}
              </button>
            ))}
          </div>
          <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {captainList
              .filter((p) => p.position === pickPos)
              .map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pickCaptain(p.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left transition hover:border-accent hover:bg-accent-soft"
                  >
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                    <span className="font-display shrink-0 text-lg font-bold text-accent">{overall(p)}</span>
                  </button>
                </li>
              ))}
          </ul>
        </main>
      )
    }

    const muts: { key: MutKey; label: string; desc: string }[] = [
      { key: 'noShields', label: S.gauntlet.mutNoShields, desc: S.gauntlet.mutNoShieldsDesc },
      { key: 'blitz', label: S.gauntlet.mutBlitz, desc: S.gauntlet.mutBlitzDesc },
      { key: 'doubleBoss', label: S.gauntlet.mutDoubleBoss, desc: S.gauntlet.mutDoubleBossDesc },
      { key: 'attackOnly', label: S.gauntlet.mutAttackOnly, desc: S.gauntlet.mutAttackOnlyDesc },
    ]
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col gap-4 bg-canvas p-3 text-ink">
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
            <div className="font-display text-base font-bold leading-none text-accent">🏆 {stats.best}</div>
            <div className="text-[9px] uppercase tracking-wide text-muted">
              {ascension > 0 ? S.gauntlet.ascension(ascension) : S.gauntlet.record}
            </div>
          </div>
        </header>

        <h2 className="font-display text-lg font-bold uppercase tracking-wide">{S.gauntlet.setupTitle}</h2>

        {/* Intensidade */}
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{S.gauntlet.intensity}</h3>
          <div className="grid grid-cols-2 gap-2">
            {INTENSITY_NAMES.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, intensity: i }))}
                className={chip(config.intensity === i)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Mutadores */}
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{S.gauntlet.mutators}</h3>
          <div className="flex flex-col gap-2">
            {muts.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleMut(m.key)}
                className={[
                  'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition',
                  config[m.key] ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface2',
                ].join(' ')}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight">{m.label}</span>
                  <span className="block text-[11px] text-muted">{m.desc}</span>
                </span>
                <span className="text-lg">{config[m.key] ? '☑️' : '⬜'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Capitão */}
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{S.gauntlet.captain}</h3>
          {captain && perks?.player ? (
            <div className="rounded-lg border border-accent bg-accent-soft p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">🧢 {perks.player.name}</span>
                <span className="font-display text-lg font-bold text-accent">{overall(perks.player)}</span>
              </div>
              <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {S.gauntlet.captainChallenges}
              </div>
              <ul className="mt-1 grid grid-cols-2 gap-1">
                {CAPTAIN_CHALLENGES.map((ch) => {
                  const done = isChallengeDone(ch, captain)
                  return (
                    <li
                      key={ch.id}
                      className={[
                        'rounded border px-1.5 py-1 text-[10px] leading-tight',
                        done ? 'border-accent text-ink' : 'border-line text-muted',
                      ].join(' ')}
                    >
                      <span className={done ? '' : 'grayscale'}>{ch.emoji}</span> <span className="font-semibold">{ch.name}</span>
                      <span className="ml-1 font-mono tabular-nums">
                        {done ? '✓' : `${Math.min(ch.cur(captain), ch.goal)}/${ch.goal}`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : captainUnlocked ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="w-full rounded-lg border border-accent bg-accent-soft py-2 text-sm font-bold text-accent transition hover:brightness-95"
            >
              {S.gauntlet.chooseCaptain}
            </button>
          ) : (
            <div className="rounded-lg border border-dashed border-line px-3 py-2 text-center text-[11px] text-muted">
              {S.gauntlet.captainHint(profile.bestRanked, CAPTAIN_UNLOCK)}
            </div>
          )}
        </div>

        {/* Seed compartilhável */}
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{S.gauntlet.seedCode}</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-line bg-surface2 px-2 py-1.5 font-mono text-sm">
              {seedCode}
            </code>
            <button type="button" onClick={copyCode} className="min-h-11 rounded-lg border border-line px-2 text-[11px] font-semibold transition hover:bg-surface2">
              {copied ? S.gauntlet.copied : S.gauntlet.copy}
            </button>
            <button type="button" onClick={rerollSeed} aria-label="nova seed" className="min-h-11 rounded-lg border border-line px-2 text-lg transition hover:bg-surface2">
              🎲
            </button>
          </div>
          <input
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder={S.gauntlet.pasteSeed}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-sm"
          />
        </div>

        <button type="button" onClick={begin} className={`font-display mt-auto rounded-lg bg-accent py-3 text-lg font-bold uppercase tracking-wide text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90`}>
          {S.gauntlet.begin}
        </button>
      </main>
    )
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
        lockedPick={perks?.player}
      />
    )
  }

  const won = series?.winner === 'player'
  const canRetry = series !== null && !won && !over && build.shields > 0
  const statCard = 'rounded-lg border border-line p-2 text-center'
  const statLabel = 'text-[10px] font-medium uppercase tracking-wide text-muted'
  const primaryBtn =
    'font-display rounded-lg bg-accent py-3 text-lg font-bold uppercase tracking-wide text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90'

  const boonCounts = activeBoons.reduce<Map<string, number>>(
    (m, b) => m.set(b.emoji, (m.get(b.emoji) ?? 0) + 1),
    new Map(),
  )
  const avg = stats.runs > 0 ? (stats.totalRounds / stats.runs).toFixed(1) : '0'

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
          <div className="font-display text-base font-bold leading-none text-accent">🏆 {stats.best}</div>
          <div className="text-[9px] uppercase tracking-wide text-muted">
            {ascension > 0 ? S.gauntlet.ascension(ascension) : S.gauntlet.record}
          </div>
        </div>
      </header>

      {/* Progresso da run */}
      <div className="grid grid-cols-2 gap-2">
        <div className={statCard}>
          <div className="font-display text-2xl font-bold text-accent">{S.gauntlet.round(round + 1)}</div>
          <div className={statLabel}>{plan.isBoss ? S.gauntlet.bossOf5 : S.gauntlet.bestOf3}</div>
        </div>
        <div className={statCard}>
          <div className="font-display text-2xl font-bold">{cleared}</div>
          <div className={statLabel}>{S.gauntlet.survived(cleared).toLowerCase()}</div>
        </div>
      </div>

      {/* Faixa do build (escudos + boons ativos) */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{S.gauntlet.yourRun}</span>
        {build.shields > 0 && <span className="font-semibold">{S.gauntlet.shields(build.shields)}</span>}
        {boonCounts.size === 0 && build.shields === 0 ? (
          <span className="text-[11px] text-muted">{S.gauntlet.noBoons}</span>
        ) : (
          [...boonCounts].map(([emoji, n]) => (
            <span key={emoji} className="tabular-nums">
              {emoji}
              {n > 1 && <span className="text-[11px] text-muted">×{n}</span>}
            </span>
          ))
        )}
      </div>

      {/* Rodada pronta para jogar */}
      {!series && !over && (
        <section className="flex flex-1 flex-col gap-3">
          {shieldNote && (
            <div className="rounded-lg border border-accent bg-accent-soft px-3 py-2 text-center text-sm font-semibold text-accent">
              {S.gauntlet.shieldUsed}
            </div>
          )}
          {bet && (
            <div className="rounded-lg border border-line bg-surface2 px-3 py-1.5 text-center text-[11px] font-semibold">
              {S.gauntlet.betActive}
            </div>
          )}
          {plan.isBoss ? (
            <div className="ls-celebrate rounded-lg bg-accent px-3 py-2 text-center font-display text-lg font-bold uppercase tracking-wide text-on-accent">
              {S.gauntlet.boss}
            </div>
          ) : (
            plan.modifier && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <span className="text-2xl leading-none">{plan.modifier.emoji}</span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted">{S.gauntlet.modifier}</span>
                  <span className="text-sm font-bold leading-tight">{plan.modifier.name}</span>
                  <span className="ml-1 text-[11px] text-muted">— {plan.modifier.desc}</span>
                </span>
              </div>
            )
          )}
          <div>
            <h2 className="mb-1 flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
              <span>{S.gauntlet.opponent}</span>
              {plan.opponentBump > 0 && <span className="text-accent">+{plan.opponentBump}</span>}
            </h2>
            <TeamStats team={opponent} title={`${opponent.name} ${opponent.season}`} />
          </div>
          <button type="button" onClick={playRound} className={`mt-auto ${primaryBtn}`}>
            {S.gauntlet.play}
          </button>
        </section>
      )}

      {/* Resultado da série */}
      {series && (
        <section className="flex flex-1 flex-col gap-3">
          <div
            className={['rounded-lg p-3 text-center', won ? 'bg-accent-soft' : 'border border-line bg-surface'].join(' ')}
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

          {/* Vitória → evento, boons, ou avançar */}
          {won && eventActive && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-pos">{S.gauntlet.event}</h3>
              <button
                type="button"
                onClick={chooseRest}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-left shadow-sm transition hover:border-accent hover:bg-accent-soft"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight">{S.gauntlet.rest}</span>
                  <span className="block text-[11px] text-muted">{S.gauntlet.restDesc}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={chooseBet}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-left shadow-sm transition hover:border-accent hover:bg-accent-soft"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight">{S.gauntlet.bet}</span>
                  <span className="block text-[11px] text-muted">{S.gauntlet.betDesc}</span>
                </span>
              </button>
            </div>
          )}
          {won && !eventActive && offer && offer.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-pos">{S.gauntlet.pickBoon}</h3>
              {offer.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => pickBoon(b)}
                  className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-left shadow-sm transition hover:border-accent hover:bg-accent-soft"
                >
                  <span className="text-2xl leading-none">{b.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">{b.name}</span>
                    <span className="block text-[11px] text-muted">{b.desc}</span>
                  </span>
                </button>
              ))}
              <p className="text-center text-[10px] text-muted">{S.gauntlet.boonNote}</p>
            </div>
          )}
          {won && !eventActive && offer && offer.length === 0 && (
            <button type="button" onClick={advance} className={`mt-auto ${primaryBtn}`}>
              {S.gauntlet.advance}
            </button>
          )}

          {/* Derrota com escudo → retry */}
          {canRetry && (
            <button type="button" onClick={useShield} className={`mt-auto ${primaryBtn}`}>
              {S.gauntlet.shields(build.shields)} · {S.gauntlet.advance}
            </button>
          )}

          {/* Fim da run */}
          {over && (
            <div className="mt-auto flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 text-center">
              <div className="font-display text-lg font-bold uppercase tracking-wide">{S.gauntlet.overTitle}</div>
              {isRecord && (
                <div className="ls-celebrate rounded-lg bg-accent px-3 py-1 text-sm font-bold uppercase tracking-wide text-on-accent">
                  {S.gauntlet.newRecord}
                </div>
              )}
              <div className="text-sm font-medium">{S.gauntlet.survived(cleared)}</div>
              <div className="grid grid-cols-3 gap-2">
                <div className={statCard}>
                  <div className="font-display text-lg font-bold tabular-nums text-accent">{stats.best}</div>
                  <div className={statLabel}>{S.gauntlet.record}</div>
                </div>
                <div className={statCard}>
                  <div className="font-display text-lg font-bold tabular-nums">{avg}</div>
                  <div className={statLabel}>{S.gauntlet.avg}</div>
                </div>
                <div className={statCard}>
                  <div className="font-display text-lg font-bold tabular-nums">{stats.runs}</div>
                  <div className={statLabel}>{S.gauntlet.runs}</div>
                </div>
              </div>
              {/* Código da run (copiar e mandar) */}
              <div>
                <div className={`mb-1 ${statLabel}`}>{S.gauntlet.seedCode}</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-line bg-surface2 px-2 py-1.5 text-left font-mono text-sm">
                    {seedCode}
                  </code>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="min-h-11 rounded-lg border border-line px-3 text-[11px] font-semibold transition hover:bg-surface2"
                  >
                    {copied ? S.gauntlet.copied : S.gauntlet.copy}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-lg border border-line bg-surface py-2 text-sm font-semibold transition hover:bg-surface2"
              >
                {S.gauntlet.share}
              </button>
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
