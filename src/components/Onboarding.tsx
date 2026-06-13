import { useEffect } from 'react'

const STEPS = [
  { tag: '1R', badge: '🥉' },
  { tag: '2R', badge: '🥈' },
  { tag: 'CF', badge: '🥇' },
  { tag: 'F', badge: '🏆' },
]

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
      aria-label="Como jogar"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border-2 border-zinc-900 bg-zinc-100 p-5 text-zinc-900 shadow-[6px_6px_0_0_#18181b] dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50 dark:shadow-[6px_6px_0_0_#fafafa]"
      >
        <h2 className="text-2xl font-black uppercase italic">🏀 Como jogar</h2>

        <p className="mt-3 text-lg font-bold leading-snug">
          Escolha seu quinteto. Enfrente os maiores times da história.
        </p>
        <p className="mt-2 text-sm opacity-80">
          Todo dia você drafta 5 jogadores e sobe 4 rodadas de playoff (melhor de 7)
          contra times lendários. Cada rodada vencida vale um selo.
        </p>

        {/* Exemplo visual do bracket */}
        <div className="mt-4 flex items-center justify-between gap-1">
          {STEPS.map((s, i) => (
            <div key={s.tag} className="flex items-center gap-1">
              <div className="border-2 border-zinc-900 bg-white px-2 py-1 text-center dark:border-zinc-100 dark:bg-zinc-900">
                <div className="text-[10px] font-black uppercase">{s.tag}</div>
                <div className="text-xl leading-none">{s.badge}</div>
              </div>
              {i < STEPS.length - 1 && <span className="font-black opacity-40">→</span>}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full border-2 border-zinc-900 bg-yellow-400 py-3 font-black uppercase text-zinc-900 shadow-[3px_3px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:shadow-[3px_3px_0_0_#fafafa]"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
