import type { Player, PlayerSilhouette as SilhouetteData } from '../../engine/types'
import { strings as S } from '../../lib/strings'
import { overall, bestRating } from '../../lib/playerStats'
import { positionColors } from './positionColors'
import { PlayerSilhouette } from './PlayerSilhouette'

const shortName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name

const FALLBACK_SIL: SilhouetteData = { height: 'medium', build: 'average', features: [] }

/**
 * Card de jogador no estilo retro: gradiente por posição, silhueta no topo,
 * nome + OVR em Teko e uma linha de destaque embaixo.
 * `highlighted` desenha o halo dourado (MVP / craque do time).
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
  const best = bestRating(player)

  return (
    <li
      className={['relative overflow-hidden rounded-lg p-1 text-center shadow-sm', ringClass].join(' ')}
      style={{ background: `linear-gradient(to bottom, ${c.from}, ${c.to})`, color: c.text }}
    >
      <div className="flex items-center justify-center gap-0.5">
        <span
          className="rounded px-1 text-[9px] font-bold"
          style={{ background: 'rgba(255,255,255,0.25)', color: c.text }}
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
          jerseyPrimary={c.jersey}
          highlighted={highlighted}
          size={56}
        />
      </div>

      <div className="truncate text-[10px] font-medium leading-tight" title={player.name}>
        {shortName(player.name)}
      </div>
      <div className="font-display text-xl font-bold leading-none">{overall(player)}</div>
      <div className="mt-0.5 text-[9px] opacity-90">
        {footer ?? (
          <span>
            {S.ratings[best.key]} <span className="font-mono tabular-nums">{best.value}</span>
          </span>
        )}
      </div>
    </li>
  )
}
