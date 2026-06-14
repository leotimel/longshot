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
        className="w-full max-w-md rounded-xl border border-stone-300 bg-amber-50 p-5 text-stone-900 shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
      >
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{S.onboarding.title}</h2>

        <p className="mt-3 text-lg font-semibold leading-snug">{S.onboarding.rule}</p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{S.onboarding.detail}</p>

        {/* Caminho das 4 rodadas, cada uma com seu selo. */}
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {STEPS.map((i) => (
            <div
              key={i}
              className="rounded-lg border border-stone-300 bg-stone-100 p-2 text-center dark:border-stone-700 dark:bg-stone-800/60"
            >
              <div className="text-2xl leading-none">{S.badges.emoji[i]}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                {S.rounds.tags[i]}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="font-display mt-5 w-full rounded-lg bg-amber-700 py-3 text-lg font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-800 active:bg-amber-900"
        >
          {S.onboarding.gotIt}
        </button>
      </div>
    </div>
  )
}
