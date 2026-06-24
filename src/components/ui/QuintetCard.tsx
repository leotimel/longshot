import type { Player, PlayerSilhouette as SilhouetteData } from '../../engine/types'
import { strings as S } from '../../lib/strings'
import { overall, bestRating } from '../../lib/playerStats'
import { positionColors } from './positionColors'
import { teamColors } from './teamColors'
import { PlayerSilhouette } from './PlayerSilhouette'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

const FALLBACK_SIL: SilhouetteData = { height: 'medium', build: 'average', features: [] }

/**
 * Card de jogador no estilo do esboco_layout_1: fundo claro/neutro, só o badge
 * de posição é colorido, silhueta com a jersey na cor do time de origem.
 * `highlighted` (MVP/craque) pinta o fundo de âmbar suave + borda âmbar.
 * `footer` sobrescreve a linha de destaque (ex: PPG do cestinha).
 */
export function QuintetCard({
  player,
  highlighted = false,
  footer,
  ringClass = '',
}: {
  player: Player
  highlighted?: boolean
  footer?: React.ReactNode
  ringClass?: string
}) {
  const c = positionColors(player.position)
  const tc = teamColors(player.teamAbbr ?? '')
  const jersey = player.teamAbbr ? tc.primary : '#1a1a1a'
  const best = bestRating(player)

  return (
    <li
      className={['relative overflow-hidden rounded-lg p-1 text-center shadow-sm', ringClass].join(' ')}
      style={{
        background: highlighted ? '#FEF3C7' : 'var(--color-surface)',
        border: highlighted ? '1px solid #F59E0B' : '1px solid var(--color-line)',
        color: 'var(--color-ink)',
      }}
    >
      <div className="flex items-center justify-center gap-0.5">
        <span
          className="rounded px-1 text-[9px] font-bold"
          style={{ background: c.from, color: '#FFFFFF' }}
        >
          {player.position}
        </span>
        {highlighted && (
          <span className="text-[9px] leading-none" title={S.bracket.mvp}>
            ⭐
          </span>
        )}
      </div>

      <div className="mt-0.5 flex justify-center">
        <PlayerSilhouette
          silhouette={player.silhouette ?? FALLBACK_SIL}
          jerseyPrimary={jersey}
          jerseySecondary={tc.secondary}
          highlighted={highlighted}
          size={56}
        />
      </div>

      <div className="truncate text-[10px] font-semibold leading-tight" title={player.name}>
        {shortName(player.name)}
      </div>
      <div className="font-display text-xl font-bold leading-none">{overall(player)}</div>
      <div className="mt-0.5 text-[9px] text-muted">
        {footer ?? (
          <span>
            {S.ratings[best.key]} <span className="font-mono tabular-nums">{best.value}</span>
          </span>
        )}
      </div>
    </li>
  )
}
