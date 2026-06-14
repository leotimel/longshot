import { useEffect } from 'react'
import { strings as S } from '../lib/strings'

const STEPS = [0, 1, 2, 3]

export function Onboarding({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={S.a11y.help}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <h2 className="text-2xl font-bold tracking-tight">{S.onboarding.title}</h2>

        <p className="mt-3 text-lg font-semibold leading-snug">{S.onboarding.rule}</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{S.onboarding.detail}</p>

        {/* Exemplo visual do bracket */}
        <div className="mt-4 flex items-center justify-between gap-1">
          {STEPS.map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-center dark:border-zinc-800 dark:bg-zinc-800">
                <div className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  {S.rounds.tags[i]}
                </div>
                <div className="text-xl leading-none">{S.badges.emoji[i]}</div>
              </div>
              {i < STEPS.length - 1 && <span className="font-semibold text-zinc-400">→</span>}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
        >
          {S.onboarding.gotIt}
        </button>
      </div>
    </div>
  )
}
