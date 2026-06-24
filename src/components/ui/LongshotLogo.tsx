/** Logo textual "LONGSHOT" — LONG azul royal + SHOT laranja, em Teko bold. */
export function LongshotLogo({ className = '' }: { className?: string }) {
  return (
    <h1
      className={`font-display text-3xl font-bold uppercase leading-none tracking-wide ${className}`}
    >
      <span style={{ color: '#1E40AF' }}>LONG</span>
      <span style={{ color: '#F97316' }}>SHOT</span>
    </h1>
  )
}
