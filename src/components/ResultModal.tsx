import { useEffect, useState } from 'react'
import type { DayRecord, Stats } from '../lib/storage'
import { strings as S } from '../lib/strings'

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
  onShare,
  onClose,
}: {
  stats: Stats
  day?: DayRecord
  onShare?: () => void
  onClose: () => void
}) {
  const [countdown, setCountdown] = useState(msToMidnight)

  useEffect(() => {
    const id = setInterval(() => setCountdown(msToMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const badge = day?.badge ?? null
  const statCard = 'rounded-xl border border-zinc-200 p-2 text-center dark:border-zinc-800'

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
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        {/* Resultado do dia */}
        {day && (
          <div className="mb-3 rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-950/40">
            {badge !== null ? (
              <>
                <div className="text-4xl leading-none">{S.badges.emoji[badge]}</div>
                <div className="mt-1 text-lg font-bold text-blue-700 dark:text-blue-300">{S.badges.labels[badge]}</div>
              </>
            ) : (
              <div className="text-base font-semibold text-zinc-600 dark:text-zinc-300">{S.result.eliminated}</div>
            )}
          </div>
        )}

        {/* Streak */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className={statCard}>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">🔥 {stats.streak}</div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {S.result.streak}
            </div>
          </div>
          <div className={statCard}>
            <div className="text-2xl font-bold">{stats.bestStreak}</div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {S.result.best}
            </div>
          </div>
        </div>

        {/* Coleção de selos */}
        <div className="mb-3">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {S.result.badgesTitle}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {S.badges.emoji.map((emoji, i) => (
              <div
                key={i}
                className={[
                  'rounded-xl border p-2 text-center',
                  badge === i
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                    : 'border-zinc-200 dark:border-zinc-800',
                ].join(' ')}
              >
                <div className="text-2xl leading-none">{emoji}</div>
                <div className="mt-1 font-mono text-sm font-semibold">×{stats.badges[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contador */}
        <div className="mb-4 text-center">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {S.result.nextDraft}
          </div>
          <div className="font-mono text-xl font-bold">{fmtCountdown(countdown)}</div>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          {day && onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
            >
              {S.result.share}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-300 bg-white py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {day ? S.result.viewBracket : S.result.close}
          </button>
        </div>
      </div>
    </div>
  )
}
