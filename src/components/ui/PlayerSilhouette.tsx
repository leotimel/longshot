import type { PlayerSilhouette as SilhouetteData } from '../../engine/types'

interface Props {
  silhouette: SilhouetteData
  jerseyPrimary: string
  jerseySecondary?: string
  highlighted?: boolean
  size?: number
}

// Neutral skin tone — generic, avoids any real-person likeness.
const SKIN = '#C68642'
const SKIN_DARK = '#A0522D'

export function PlayerSilhouette({
  silhouette,
  jerseyPrimary,
  jerseySecondary = '#FFFFFF',
  highlighted = false,
  size = 80,
}: Props) {
  const { height, build, features } = silhouette

  // Parametric proportions
  const headR    = size * 0.14
  const neckH    = height === 'tall' ? size * 0.07 : size * 0.05
  const shoulderW = build === 'stocky' ? size * 0.52 : build === 'slim' ? size * 0.36 : size * 0.44
  const torsoH   = height === 'short' ? size * 0.30 : size * 0.24
  const torsoY   = size * 0.38 + neckH
  const torsoX   = (size - shoulderW) / 2

  const headCY = size * 0.18
  const headCX = size / 2
  const neckX  = headCX - size * 0.05
  const neckY  = headCY + headR

  const isAfro = features.includes('afro')
  const isBald = features.includes('bald')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Halo dourado para jogador em destaque */}
      {highlighted && (
        <circle
          cx={headCX}
          cy={headCY}
          r={headR + size * 0.06}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={size * 0.03}
          opacity={0.5}
        />
      )}

      {/* Cabelo / topo da cabeça */}
      {isAfro && (
        <ellipse
          cx={headCX}
          cy={headCY - headR * 0.3}
          rx={headR * 1.4}
          ry={headR * 1.2}
          fill={SKIN_DARK}
        />
      )}

      {/* Cabeça */}
      <ellipse
        cx={headCX}
        cy={headCY}
        rx={headR}
        ry={isBald ? headR * 1.05 : headR}
        fill={SKIN}
      />

      {/* Faixa na frente (headband) */}
      {features.includes('headband') && (
        <rect
          x={headCX - headR}
          y={headCY - headR * 0.55}
          width={headR * 2}
          height={headR * 0.32}
          rx={headR * 0.1}
          fill={jerseySecondary}
          opacity={0.9}
        />
      )}

      {/* Barba completa */}
      {features.includes('beard') && (
        <ellipse
          cx={headCX}
          cy={headCY + headR * 0.55}
          rx={headR * 0.7}
          ry={headR * 0.45}
          fill={SKIN_DARK}
        />
      )}

      {/* Cavanhaque (goatee — menor que barba) */}
      {features.includes('goatee') && !features.includes('beard') && (
        <ellipse
          cx={headCX}
          cy={headCY + headR * 0.65}
          rx={headR * 0.35}
          ry={headR * 0.28}
          fill={SKIN_DARK}
        />
      )}

      {/* Locs — paths finos laterais */}
      {features.includes('locs') && (
        <>
          {[-0.6, -0.3, 0.3, 0.6].map((offset) => (
            <rect
              key={offset}
              x={headCX + offset * headR - size * 0.015}
              y={headCY - headR * 0.2}
              width={size * 0.03}
              height={headR * 0.9}
              rx={size * 0.01}
              fill={SKIN_DARK}
            />
          ))}
        </>
      )}

      {/* Pescoço */}
      <rect
        x={neckX}
        y={neckY - 1}
        width={size * 0.1}
        height={neckH + 2}
        fill={SKIN}
      />

      {/* Corpo / jersey */}
      <rect
        x={torsoX}
        y={torsoY}
        width={shoulderW}
        height={torsoH}
        rx={size * 0.04}
        fill={jerseyPrimary}
      />

      {/* Número 00 na jersey */}
      <text
        x={headCX}
        y={torsoY + torsoH * 0.62}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={torsoH * 0.38}
        fontWeight="bold"
        fontFamily="monospace"
        fill={jerseySecondary}
        opacity={0.85}
      >
        00
      </text>
    </svg>
  )
}
