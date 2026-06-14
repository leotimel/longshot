import { useMemo, useState } from 'react'
import type { Player } from './engine/types'
import { usePlayoff } from './hooks/usePlayoff'
import { DraftScreen } from './components/DraftScreen'
import { BracketView } from './components/BracketView'
import { ResultModal } from './components/ResultModal'
import { Onboarding } from './components/Onboarding'
import { buildShareText, shareText } from './lib/share'
import { challengeTarget, challengeUrl, readChallenge } from './lib/challenge'
import { hasOnboarded, setOnboarded } from './lib/storage'

/** Data local de hoje no formato YYYY-MM-DD. */
function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function App() {
  const date = todayISO()
  const { draft, locked, day, bracket, stats, confirm, justConfirmed } = usePlayoff(date)
  const [statsOpen, setStatsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(() => !hasOnboarded())

  const dismissHelp = () => {
    setOnboarded()
    setShowHelp(false)
  }

  // Desafio no hash da URL: só vale "Supere: X" se for do mesmo dia.
  const challenge = useMemo(() => readChallenge(), [])
  const challengeBanner =
    challenge && challenge.date === date ? challengeTarget(challenge.badge) : undefined

  const handleStart = (team: Player[]) => {
    confirm(team) // o resultado é revelado ao fim do playoff gradual
  }

  const handleShare = () => {
    if (!day) return
    const text = buildShareText(day, stats.streak)
    const url = challengeUrl({ date: day.date, badge: day.badge })
    void shareText(`${text}\n${url}`)
  }

  return (
    <>
      {locked && bracket ? (
        <BracketView
          bracket={bracket}
          opponents={draft.bracket}
          gradual={justConfirmed}
          onPlayoffEnd={() => setStatsOpen(true)}
          onOpenStats={() => setStatsOpen(true)}
          onOpenHelp={() => setShowHelp(true)}
        />
      ) : (
        <DraftScreen
          draft={draft}
          onStartPlayoff={handleStart}
          onOpenStats={() => setStatsOpen(true)}
          onOpenHelp={() => setShowHelp(true)}
          challengeTarget={challengeBanner}
        />
      )}

      {statsOpen && (
        <ResultModal
          stats={stats}
          day={day}
          onShare={handleShare}
          onClose={() => setStatsOpen(false)}
        />
      )}

      {showHelp && <Onboarding onClose={dismissHelp} />}
    </>
  )
}

export default App
