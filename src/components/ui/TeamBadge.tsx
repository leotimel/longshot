import { useState } from 'react'
import { teamColors } from './teamColors'

interface Props {
  abbr: string
  teamName: string
  size?: 'sm' | 'md'
}

const PX = { sm: 28, md: 40 } as const

function FallbackBadge({ abbr, px }: { abbr: string; px: number }) {
  const { primary, secondary } = teamColors(abbr)
  const label = abbr.slice(0, 3)
  const fontSize = px * 0.28

  // Hexágono retro: 6 pontos calculados a partir do centro
  const cx = px / 2
  const cy = px / 2
  const r = px * 0.44
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-label={abbr}>
      <polygon points={points} fill={primary} />
      <polygon
        points={points}
        fill="none"
        stroke={secondary}
        strokeWidth={px * 0.04}
        opacity={0.6}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="'Teko', 'Arial Narrow', sans-serif"
        letterSpacing="0.02em"
        fill={secondary}
      >
        {label}
      </text>
    </svg>
  )
}

export function TeamBadge({ abbr, teamName, size = 'sm' }: Props) {
  const px = PX[size]
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <FallbackBadge abbr={abbr} px={px} />
  }

  return (
    <img
      src={`https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`}
      alt={teamName}
      width={px}
      height={px}
      className="object-contain"
      onError={() => setFailed(true)}
    />
  )
}
