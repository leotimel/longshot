import type { LevelInfo } from '../lib/level'
import { strings as S } from '../lib/strings'

/** Selo compacto de nível no header; toca para abrir o painel de progresso (📊). */
export function LevelBadge({ level, onClick }: { level: LevelInfo; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={S.level.badgeAria(level.level)}
      className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line px-2 text-xs font-bold leading-none"
    >
      <span className="font-display text-accent">{S.level.tag(level.level)}</span>
      <span aria-hidden="true">{level.emblem}</span>
    </button>
  )
}
