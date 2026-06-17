/**
 * Confete de celebração (canvas-confetti). Respeita prefers-reduced-motion
 * (não dispara). `big` = burst maior (ex.: 16-0 invicto). Fora do engine.
 */
import confetti from 'canvas-confetti'

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  )
}

/** Há canvas funcional? (false em jsdom/SSR — evita quebrar testes.) */
function canConfetti(): boolean {
  if (typeof document === 'undefined') return false
  try {
    return !!document.createElement('canvas').getContext('2d')
  } catch {
    return false
  }
}

export function celebrate(big = false): void {
  if (reducedMotion() || !canConfetti()) return
  const base = { spread: 75, origin: { y: 0.6 }, scalar: 0.9 }
  confetti({ ...base, particleCount: big ? 160 : 90 })
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 120, angle: 60, origin: { x: 0, y: 0.65 } }), 150)
    setTimeout(() => confetti({ ...base, particleCount: 120, angle: 120, origin: { x: 1, y: 0.65 } }), 300)
  }
}
