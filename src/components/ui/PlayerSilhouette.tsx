import type { PlayerSilhouette as SilhouetteData } from '../../engine/types'

interface Props {
  silhouette: SilhouetteData
  jerseyPrimary: string
  jerseySecondary?: string
  highlighted?: boolean
  size?: number
}

// Paleta de tons de pele (genéricos; evita semelhança com pessoa real). `dark` é o
// tom mais escuro usado para sombras (barba, afro, locs) sobre a pele base.
const SKIN_PALETTE = {
  light:  { base: '#F4C591', dark: '#D4956A' },
  medium: { base: '#C68642', dark: '#A0522D' },
  dark:   { base: '#8D5524', dark: '#6B3E1C' },
} as const

/**
 * Busto flat de jogador, paramétrico. Desenhado para ser legível mesmo em
 * size pequeno (56): cabeça + pescoço + braços + torso (jersey). As `features`
 * (barba/faixa/afro/careca/cavanhaque/locs/tattoo/wristband) adicionam detalhes.
 */
export function PlayerSilhouette({
  silhouette,
  jerseyPrimary,
  jerseySecondary = '#FFFFFF',
  highlighted = false,
  size = 80,
}: Props) {
  const { height, build, features } = silhouette
  const { base: SKIN, dark: SKIN_DARK } = SKIN_PALETTE[silhouette.skin ?? 'medium']
  const HAIR = silhouette.skin === 'light' ? '#8B6914' : '#2C1810'

  // Posição vertical da cabeça — altos ficam mais acima para dar espaço ao torso
  const headR = size * 0.15
  const headCX = size / 2
  const headCY = size * (height === 'tall' ? 0.17 : height === 'short' ? 0.22 : 0.19)

  const neckW = size * 0.1
  const neckH = size * (height === 'tall' ? 0.09 : height === 'short' ? 0.04 : 0.06)
  const neckY = headCY + headR
  const torsoTop = neckY + neckH

  // Torso mais longo para baixinhos, mais comprimido para os altos
  const torsoH = size * (height === 'short' ? 0.38 : height === 'tall' ? 0.27 : 0.32)

  // Ombros mais exagerados para diferenciar builds
  const shoulderW =
    build === 'stocky' ? size * 0.64 : build === 'slim' ? size * 0.30 : size * 0.46
  const torsoX = (size - shoulderW) / 2

  const armW = neckW
  const armH = torsoH * 0.62

  const isAfro = features.includes('afro')
  const isBald = features.includes('bald')
  const hasTattoo = features.includes('tattoo')
  const hasWristband = features.includes('wristband')

  // Número real na jersey; fontSize proporcional ao comprimento
  const jerseyNum = silhouette.number !== undefined ? String(silhouette.number) : '?'
  const numFontSize = jerseyNum.length >= 2 ? torsoH * 0.28 : torsoH * 0.36

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Halo dourado para jogador em destaque */}
      {highlighted && (
        <circle
          cx={headCX}
          cy={headCY}
          r={headR + size * 0.07}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={size * 0.03}
          opacity={0.55}
        />
      )}

      {/* Cap de cabelo — "topo" escuro na cabeça (não para afro/careca) */}
      {!isAfro && !isBald && (
        <ellipse
          cx={headCX}
          cy={headCY - headR * 0.35}
          rx={headR}
          ry={headR * 0.55}
          fill={HAIR}
        />
      )}

      {/* Afro — volume sobre o topo da cabeça */}
      {isAfro && (
        <ellipse
          cx={headCX}
          cy={headCY - headR * 0.35}
          rx={headR * 1.45}
          ry={headR * 1.25}
          fill={SKIN_DARK}
        />
      )}

      {/* Sobrancelhas — dois rects finos acima dos olhos (exceto careca e afro) */}
      {!isBald && !isAfro && (
        <>
          <rect
            x={headCX - headR * 0.55}
            y={headCY - headR * 0.35}
            width={headR * 0.38}
            height={headR * 0.11}
            rx={headR * 0.05}
            fill={HAIR}
          />
          <rect
            x={headCX + headR * 0.18}
            y={headCY - headR * 0.35}
            width={headR * 0.38}
            height={headR * 0.11}
            rx={headR * 0.05}
            fill={HAIR}
          />
        </>
      )}

      {/* Cabeça */}
      <ellipse cx={headCX} cy={headCY} rx={headR} ry={isBald ? headR * 1.05 : headR} fill={SKIN} />

      {/* Faixa na fronte (headband) */}
      {features.includes('headband') && (
        <rect
          x={headCX - headR}
          y={headCY - headR * 0.55}
          width={headR * 2}
          height={headR * 0.32}
          rx={headR * 0.1}
          fill={jerseySecondary}
          opacity={0.92}
        />
      )}

      {/* Barba completa */}
      {features.includes('beard') && (
        <ellipse
          cx={headCX}
          cy={headCY + headR * 0.6}
          rx={headR * 0.72}
          ry={headR * 0.5}
          fill={SKIN_DARK}
        />
      )}

      {/* Cavanhaque (goatee — só quando não há barba completa) */}
      {features.includes('goatee') && !features.includes('beard') && (
        <ellipse
          cx={headCX}
          cy={headCY + headR * 0.7}
          rx={headR * 0.34}
          ry={headR * 0.28}
          fill={SKIN_DARK}
        />
      )}

      {/* Locs — mechas finas descendo das laterais */}
      {features.includes('locs') &&
        [-0.7, -0.4, 0.4, 0.7].map((offset) => (
          <rect
            key={offset}
            x={headCX + offset * headR - size * 0.015}
            y={headCY - headR * 0.2}
            width={size * 0.03}
            height={headR * 1}
            rx={size * 0.01}
            fill={SKIN_DARK}
          />
        ))}

      {/* Pescoço */}
      <rect x={headCX - neckW / 2} y={neckY - 1} width={neckW} height={neckH + 2} fill={SKIN} />

      {/* Braço esquerdo */}
      <rect
        x={torsoX - armW * 0.4}
        y={torsoTop}
        width={armW}
        height={armH}
        rx={armW * 0.5}
        fill={SKIN}
        transform={`rotate(12 ${torsoX} ${torsoTop})`}
      />
      {/* Tattoo braço esquerdo */}
      {hasTattoo && ([0.25, 0.45, 0.65] as const).map((frac) => (
        <rect
          key={frac}
          x={torsoX - armW * 0.4}
          y={torsoTop + armH * frac}
          width={armW * 0.9}
          height={size * 0.012}
          rx={size * 0.004}
          fill={SKIN_DARK}
          opacity={0.4}
          transform={`rotate(12 ${torsoX} ${torsoTop})`}
        />
      ))}
      {/* Wristband braço esquerdo */}
      {hasWristband && (
        <rect
          x={torsoX - armW * 0.4 - armW * 0.05}
          y={torsoTop + armH * 0.82}
          width={armW * 1.1}
          height={size * 0.03}
          rx={size * 0.01}
          fill={jerseySecondary}
          opacity={0.9}
          transform={`rotate(12 ${torsoX} ${torsoTop})`}
        />
      )}

      {/* Braço direito */}
      <rect
        x={torsoX + shoulderW - armW * 0.6}
        y={torsoTop}
        width={armW}
        height={armH}
        rx={armW * 0.5}
        fill={SKIN}
        transform={`rotate(-12 ${torsoX + shoulderW} ${torsoTop})`}
      />
      {/* Tattoo braço direito */}
      {hasTattoo && ([0.25, 0.45, 0.65] as const).map((frac) => (
        <rect
          key={frac}
          x={torsoX + shoulderW - armW * 0.6}
          y={torsoTop + armH * frac}
          width={armW * 0.9}
          height={size * 0.012}
          rx={size * 0.004}
          fill={SKIN_DARK}
          opacity={0.4}
          transform={`rotate(-12 ${torsoX + shoulderW} ${torsoTop})`}
        />
      ))}
      {/* Wristband braço direito */}
      {hasWristband && (
        <rect
          x={torsoX + shoulderW - armW * 0.6 - armW * 0.05}
          y={torsoTop + armH * 0.82}
          width={armW * 1.1}
          height={size * 0.03}
          rx={size * 0.01}
          fill={jerseySecondary}
          opacity={0.9}
          transform={`rotate(-12 ${torsoX + shoulderW} ${torsoTop})`}
        />
      )}

      {/* Torso / jersey (regata) */}
      <rect
        x={torsoX}
        y={torsoTop}
        width={shoulderW}
        height={torsoH}
        rx={size * 0.05}
        fill={jerseyPrimary}
      />

      {/* Número real na jersey */}
      <text
        x={headCX}
        y={torsoTop + torsoH * 0.58}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={numFontSize}
        fontWeight="bold"
        fontFamily="monospace"
        fill={jerseySecondary}
        opacity={0.9}
      >
        {jerseyNum}
      </text>
    </svg>
  )
}
