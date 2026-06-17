import { useEffect, useMemo, useState } from 'react'
import type { DayRecord, Stats } from '../lib/storage'
import { getSeenAchievements, setSeenAchievements } from '../lib/storage'
import type { LevelInfo } from '../lib/level'
import { summarizeHistory } from '../lib/playerHistory'
import { computeAchievements } from '../lib/achievements'
import { SKINS, isSkinUnlocked } from '../lib/skins'
import { FRAMES, isFrameUnlocked } from '../lib/frames'
import { isMuted, playLevelUp, playUnlock, toggleMuted } from '../lib/sound'
import { celebrate } from '../lib/confetti'
import { strings as S } from '../lib/strings'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

/** Milissegundos até a próxima meia-noite local (próximo draft). */
function msToMidnight(): number {
  const now = new Date()
  const mid = new Date(now)
  mid.setHours(24, 0, 0, 0)
  return Math.max(0, mid.getTime() - now.getTime())
}

function fmtCountdown(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

export function ResultModal({
  stats,
  day,
  level,
  leveledUp = false,
  todayXp = 0,
  skin = 'hardwood',
  frame = 'none',
  onChooseSkin,
  onChooseFrame,
  onShare,
  onClose,
}: {
  stats: Stats
  day?: DayRecord
  level?: LevelInfo
  leveledUp?: boolean
  todayXp?: number
  skin?: string
  frame?: string
  onChooseSkin?: (id: string) => void
  onChooseFrame?: (id: string) => void
  onShare?: () => void
  onClose: () => void
}) {
  const [countdown, setCountdown] = useState(msToMidnight)
  const [muted, setMutedState] = useState(isMuted)
  const hist = useMemo(() => summarizeHistory(stats.history), [stats.history])
  const achievements = useMemo(() => computeAchievements(stats, hist), [stats, hist])
  const doneCount = achievements.filter((a) => a.done).length

  // Conquistas novas desde a última abertura (calculado uma vez, ao montar).
  const [newlyUnlocked] = useState<Set<string>>(() => {
    const seen = new Set(getSeenAchievements())
    return new Set(achievements.filter((a) => a.done && !seen.has(a.id)).map((a) => a.id))
  })

  useEffect(() => {
    const id = setInterval(() => setCountdown(msToMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  // Comemora e marca como vistas as conquistas recém-desbloqueadas (uma vez).
  useEffect(() => {
    if (newlyUnlocked.size > 0) {
      playUnlock()
      celebrate()
      setSeenAchievements(achievements.filter((a) => a.done).map((a) => a.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Comemoração ao subir de nível (uma vez, ao abrir o modal).
  useEffect(() => {
    if (leveledUp) {
      playLevelUp()
      celebrate()
    }
  }, [leveledUp])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const badge = day?.badge ?? null
  const statCard = 'rounded-lg border border-line p-2 text-center'
  const statLabel = 'text-[10px] font-medium uppercase tracking-wide text-muted'
  const sectionTitle = 'mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted'
  const topPoints = hist.scorers[0]?.points ?? 0
  const xpPct = level && level.xpForNext > 0 ? Math.round((level.xpInLevel / level.xpForNext) * 100) : 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={S.a11y.resultDialog}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90svh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-xl"
      >
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Nível & XP */}
        {level && (
          <div className="mb-3">
            {leveledUp && (
              <div className="ls-celebrate mb-2 rounded-lg bg-accent px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-on-accent">
                🎉 {S.level.leveledUp}
              </div>
            )}
            <div className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{level.emblem}</span>
                  <div>
                    <div className="font-display text-lg font-bold uppercase leading-none">
                      {S.level.tag(level.level)}
                    </div>
                    <div className="text-[11px] text-muted">{level.codename}</div>
                  </div>
                </div>
                {day && todayXp > 0 && (
                  <div className="text-[11px] font-semibold text-pos">{S.level.todayXp(todayXp)}</div>
                )}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
                <div className="ls-xpfill h-full rounded-full bg-accent" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="mt-1 text-right text-[10px] tabular-nums text-muted">
                {S.level.toNext(level.xpInLevel, level.xpForNext)}
              </div>
            </div>
          </div>
        )}

        {/* Resultado do dia */}
        {day && (
          <div className="mb-3 rounded-lg bg-accent-soft p-3 text-center">
            {badge !== null ? (
              <>
                <div className="text-4xl leading-none">{S.badges.emoji[badge]}</div>
                <div className="font-display mt-1 text-lg font-bold uppercase tracking-wide text-accent">
                  {S.badges.labels[badge]}
                </div>
              </>
            ) : (
              <div className="text-base font-semibold text-muted">{S.result.eliminated}</div>
            )}
          </div>
        )}

        {/* Streak */}
        <div className={`mb-3 grid gap-2 ${stats.freezes > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div className={statCard}>
            <div className="font-display text-2xl font-bold text-accent">🔥 {stats.streak}</div>
            <div className={statLabel}>{S.result.streak}</div>
          </div>
          <div className={statCard}>
            <div className="font-display text-2xl font-bold">{stats.bestStreak}</div>
            <div className={statLabel}>{S.result.best}</div>
          </div>
          {stats.freezes > 0 && (
            <div className={statCard}>
              <div className="font-display text-2xl font-bold">🛡 {stats.freezes}</div>
              <div className={statLabel}>{S.result.freezes}</div>
            </div>
          )}
        </div>

        {/* Coleção de selos */}
        <div className="mb-3">
          <h3 className={sectionTitle}>{S.result.badgesTitle}</h3>
          <div className="grid grid-cols-4 gap-2">
            {S.badges.emoji.map((emoji, i) => (
              <div
                key={i}
                className={[
                  'rounded-lg border p-2 text-center',
                  badge === i ? 'border-accent bg-accent-soft' : 'border-line',
                ].join(' ')}
              >
                <div className="text-2xl leading-none">{emoji}</div>
                <div className="mt-1 font-mono text-sm font-semibold">×{stats.badges[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico de jogadores (acumulado entre dias) */}
        <div className="mb-3">
          <h3 className={sectionTitle}>{S.result.playersTitle}</h3>
          {hist.scorers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-muted">
              {S.result.emptyHistory}
            </p>
          ) : (
            <>
              {/* Resumo de uso */}
              <div className="mb-2 grid grid-cols-3 gap-2">
                <div className={statCard}>
                  <div className="font-display text-lg font-bold tabular-nums">{hist.distinctPlayers}</div>
                  <div className={statLabel}>{S.result.used}</div>
                </div>
                <div className={statCard}>
                  <div className="truncate text-sm font-bold">
                    {hist.favorite ? shortName(hist.favorite.name) : '—'}
                  </div>
                  <div className={statLabel}>{S.result.favorite}</div>
                </div>
                <div className={statCard}>
                  <div className="font-display text-lg font-bold tabular-nums">{hist.totalPoints}</div>
                  <div className={statLabel}>{S.result.careerPoints}</div>
                </div>
              </div>

              {/* Cestinhas (todos os tempos) */}
              <h4 className={sectionTitle}>{S.result.scorers}</h4>
              <ol className="mb-2 flex flex-col gap-1">
                {hist.scorers.slice(0, 5).map((c, i) => (
                  <li
                    key={c.playerId}
                    className="relative overflow-hidden rounded-lg border border-line px-2 py-1"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-accent-soft"
                      style={{ width: `${topPoints > 0 ? (c.points / topPoints) * 100 : 0}%` }}
                      aria-hidden="true"
                    />
                    <div className="relative flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="w-3 shrink-0 text-right font-mono text-muted">{i + 1}</span>
                        <span className="truncate font-semibold">{c.name}</span>
                        <span className="shrink-0 text-[10px] text-muted">{S.result.picks(c.picks)}</span>
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        <span className="font-bold text-accent">{c.points}</span>
                        <span className="ml-1 text-[10px] text-muted">
                          {c.ppg.toFixed(1)} {S.result.ppg}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Recordes */}
              <h4 className={sectionTitle}>{S.result.records}</h4>
              <div className={`grid gap-2 ${hist.perfectRuns > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className={statCard}>
                  <div className="font-display text-lg font-bold tabular-nums">
                    {hist.recordGame ? hist.recordGame.points : '—'}
                  </div>
                  <div className={`truncate ${statLabel}`}>
                    {S.result.recordGame}
                    {hist.recordGame ? ` · ${shortName(hist.recordGame.name)}` : ''}
                  </div>
                </div>
                <div className={statCard}>
                  <div className="font-display text-lg font-bold tabular-nums">
                    {hist.bestCampaign ? hist.bestCampaign.points : '—'}
                  </div>
                  <div className={statLabel}>{S.result.bestCampaign}</div>
                </div>
                {hist.perfectRuns > 0 && (
                  <div className={`${statCard} border-accent`}>
                    <div className="font-display text-lg font-bold tabular-nums text-accent">{hist.perfectRuns}</div>
                    <div className={statLabel}>{S.result.invictas}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Conquistas (mural) */}
        <div className="mb-3">
          <h3 className={sectionTitle}>{S.result.achievementsTitle(doneCount, achievements.length)}</h3>
          <div className="grid grid-cols-2 gap-2">
            {[...achievements]
              .sort((a, b) => {
                const rank = (x: typeof a) => (newlyUnlocked.has(x.id) ? 2 : x.done ? 1 : 0)
                const d = rank(b) - rank(a)
                if (d !== 0) return d
                if (!a.done && !b.done) return (b.progress ?? 0) - (a.progress ?? 0)
                return 0
              })
              .map((a) => (
                <div
                  key={a.id}
                  className={[
                    'rounded-lg border p-2',
                    a.done ? 'border-accent bg-accent-soft' : 'border-line opacity-70',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg leading-none ${a.done ? '' : 'grayscale'}`}>{a.emoji}</span>
                    <span className="text-xs font-bold leading-tight">{a.name}</span>
                    {newlyUnlocked.has(a.id) && (
                      <span className="ml-auto rounded bg-accent px-1 text-[9px] font-bold uppercase tracking-wide text-on-accent">
                        {S.result.achNew}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-tight text-muted">{a.desc}</p>
                  {!a.done && a.progress !== undefined && (
                    <div className="mt-1">
                      <div className="h-1 overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.round(a.progress * 100)}%` }}
                        />
                      </div>
                      <div className="mt-0.5 text-right text-[9px] tabular-nums text-muted">{a.progressLabel}</div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Cosméticos: skin + moldura */}
        {level && onChooseSkin && (
          <div className="mb-3">
            <h3 className={sectionTitle}>{S.cosmetics.skins}</h3>
            <div className="flex flex-wrap gap-1.5">
              {SKINS.map((sk) => {
                const unlocked = isSkinUnlocked(sk, level.level)
                const selected = sk.id === skin
                return (
                  <button
                    key={sk.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onChooseSkin(sk.id)}
                    className={[
                      'flex min-h-11 items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition',
                      selected ? 'border-accent ring-1 ring-accent' : 'border-line',
                      unlocked ? 'hover:bg-surface2' : 'opacity-50',
                    ].join(' ')}
                  >
                    <span
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line"
                      style={{ background: sk.swatch.surface }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: sk.swatch.accent }} />
                    </span>
                    <span>{sk.name}</span>
                    {!unlocked && <span className="text-[10px] text-muted">{S.cosmetics.locked(sk.unlockLevel)}</span>}
                  </button>
                )
              })}
            </div>

            {onChooseFrame && (
              <>
                <h3 className={`mt-2 ${sectionTitle}`}>{S.cosmetics.frames}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {FRAMES.map((fr) => {
                    const unlocked = isFrameUnlocked(fr, level.level)
                    const selected = fr.id === frame
                    return (
                      <button
                        key={fr.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => onChooseFrame(fr.id)}
                        className={[
                          'flex min-h-11 items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition',
                          selected ? 'border-accent ring-1 ring-accent' : 'border-line',
                          unlocked ? 'hover:bg-surface2' : 'opacity-50',
                        ].join(' ')}
                      >
                        <span
                          className="inline-block h-4 w-4 shrink-0 rounded-full border-2"
                          style={{
                            borderColor: fr.swatch === 'transparent' ? 'var(--color-line)' : fr.swatch,
                            background: 'var(--color-surface2)',
                          }}
                        />
                        <span>{fr.name}</span>
                        {!unlocked && <span className="text-[10px] text-muted">{S.cosmetics.locked(fr.unlockLevel)}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

          {/* Som */}
          <button
            type="button"
            onClick={() => setMutedState(toggleMuted())}
            className="mb-3 self-center rounded-lg border border-line px-3 py-1 text-[11px] font-semibold text-muted transition hover:bg-surface2"
          >
            {muted ? S.result.soundOff : S.result.soundOn}
          </button>

          {/* Contador */}
          <div className="text-center">
            <div className={statLabel}>{S.result.nextDraft}</div>
            <div className="font-mono text-xl font-bold">{fmtCountdown(countdown)}</div>
          </div>
        </div>

        {/* Botões — rodapé fixo (sempre visível, sem precisar rolar) */}
        <div className="flex shrink-0 gap-2 border-t border-line bg-surface p-3">
          {day && onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex-1 rounded-lg bg-accent py-3 font-semibold text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90"
            >
              {S.result.share}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-line bg-surface py-3 font-semibold transition hover:bg-surface2"
          >
            {day ? S.result.viewBracket : S.result.close}
          </button>
        </div>
      </div>
    </div>
  )
}
