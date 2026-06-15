import { useEffect } from 'react'
import { strings as S } from '../lib/strings'

/** Guia (somente leitura) da prancheta: o que cada ação faz, custo e quando usar. */
export function CoachGuide({ onClose }: { onClose: () => void }) {
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
      aria-label={S.tactics.guide.title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90svh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-xl"
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{S.tactics.guide.title}</h2>
          <p className="text-sm text-muted">{S.tactics.guide.budget}</p>
          <ul className="mt-1 flex flex-col gap-2">
            {S.tactics.guide.items.map((it) => (
              <li key={it.name} className="rounded-lg border border-line bg-surface2 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{it.icon}</span>
                  <span className="font-semibold">{it.name}</span>
                  <span className="ml-auto rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {S.tactics.cost}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-snug">{it.effect}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  <span className="font-semibold">Quando:</span> {it.when}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 border-t border-line bg-surface p-3">
          <button
            type="button"
            onClick={onClose}
            className="font-display w-full rounded-lg bg-accent py-3 text-lg font-bold uppercase tracking-wide text-on-accent shadow-sm transition hover:brightness-95 active:brightness-90"
          >
            {S.tactics.guide.gotIt}
          </button>
        </div>
      </div>
    </div>
  )
}
