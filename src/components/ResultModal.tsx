import { useEffect, useState } from 'react'
import type { DayRecord, Stats } from '../lib/storage'

const BADGE_EMOJI = ['🥉', '🥈', '🥇', '🏆']
const BADGE_LABELS = [
  'First Round Survivor',
  'Conference Semis',
  'Conference Finals',
  'Champion!',
]

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resultado e estatísticas"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border-2 border-zinc-900 bg-zinc-100 p-4 text-zinc-900 shadow-[6px_6px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50 dark:shadow-[6px_6px_0_0_#fafafa]"
      >
        {/* Resultado do dia */}
        {day && (
          <div className="mb-3 border-2 border-zinc-900 bg-yellow-300 p-3 text-center text-zinc-900 dark:border-zinc-100">
            {badge !== null ? (
              <>
                <div className="text-4xl leading-none">{BADGE_EMOJI[badge]}</div>
                <div className="mt-1 text-lg font-black uppercase italic">{BADGE_LABELS[badge]}</div>
              </>
            ) : (
              <div className="text-base font-black uppercase">Eliminado no First Round</div>
            )}
          </div>
        )}

        {/* Streak */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="border-2 border-zinc-900 p-2 text-center dark:border-zinc-100">
            <div className="text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">🔥 {stats.streak}</div>
            <div className="text-[10px] font-bold uppercase opacity-70">streak</div>
          </div>
          <div className="border-2 border-zinc-900 p-2 text-center dark:border-zinc-100">
            <div className="text-2xl font-black">{stats.bestStreak}</div>
            <div className="text-[10px] font-bold uppercase opacity-70">melhor</div>
          </div>
        </div>

        {/* Coleção de selos */}
        <div className="mb-3">
          <h3 className="mb-1 text-[11px] font-black uppercase tracking-wide opacity-70">
            Selos conquistados
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {BADGE_EMOJI.map((emoji, i) => (
              <div
                key={i}
                className={[
                  'border-2 border-zinc-900 p-2 text-center dark:border-zinc-100',
                  badge === i ? 'bg-teal-300 text-zinc-900' : '',
                ].join(' ')}
              >
                <div className="text-2xl leading-none">{emoji}</div>
                <div className="mt-1 font-mono text-sm font-black">×{stats.badges[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contador */}
        <div className="mb-4 text-center">
          <div className="text-[11px] font-bold uppercase opacity-70">Próximo draft em</div>
          <div className="font-mono text-xl font-black">{fmtCountdown(countdown)}</div>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          {day && onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex-1 border-2 border-zinc-900 bg-fuchsia-500 py-3 font-black uppercase text-white shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:shadow-[3px_3px_0_0_#fafafa]"
            >
              Compartilhar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-2 border-zinc-900 bg-yellow-400 py-3 font-black uppercase text-zinc-900 shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:shadow-[3px_3px_0_0_#fafafa]"
          >
            {day ? 'Ver Bracket' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  )
}
