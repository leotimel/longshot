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
        className="w-full max-w-md rounded-xl border border-line bg-surface p-5 text-ink shadow-xl"
      >
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{S.onboarding.title}</h2>

        <p className="mt-3 text-lg font-semibold leading-snug">{S.onboarding.rule}</p>
        <p className="mt-2 text-sm text-muted">{S.onboarding.detail}</p>

        {/* Caminho das 4 rodadas, cada uma com seu selo. */}
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {STEPS.map((i) => (
            <div key={i} className="rounded-lg border border-line bg-surface2 p-2 text-center">
              <div className="text-2xl leading-none">{S.badges.emoji[i]}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                {S.rounds.tags[i]}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-line bg-surface2 p-3">
          <div className="font-display text-sm font-bold uppercase tracking-wide">{S.onboarding.coachTitle}</div>
          <p className="mt-1 text-[13px] text-muted">{S.onboarding.coach}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="font-display mt-5 w-full rounded-lg bg-accent py-3 text-lg font-bold uppercase tracking-wide text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90"
        >
          {S.onboarding.gotIt}
        </button>
      </div>
    </div>
  )
}
