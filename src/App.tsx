import { useMemo, useState } from 'react'
import type { Player } from './engine/types'
import { usePlayoff } from './hooks/usePlayoff'
import { DraftScreen } from './components/DraftScreen'
import { BracketView } from './components/BracketView'
import { ResultModal } from './components/ResultModal'
import { GauntletScreen } from './components/GauntletScreen'
import { Onboarding } from './components/Onboarding'
import { buildShareText, LONGSHOT_URL, shareText } from './lib/share'
import { challengeTarget, readChallenge } from './lib/challenge'
import { applySkin } from './lib/skins'
import { frameById } from './lib/frames'
import {
  getFrame,
  getSkin,
  hasOnboarded,
  hasSeenCoachTip,
  setFrame,
  setOnboarded,
  setSeenCoachTip,
  setSkin,
} from './lib/storage'

/** Data local de hoje no formato YYYY-MM-DD. */
function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function App() {
  const date = todayISO()
  const {
    draft,
    locked,
    day,
    team,
    bracket,
    stats,
    displayStats,
    displayDay,
    displayLevel,
    displayLeveledUp,
    displayTodayXp,
    sixthMan,
    tactics,
    fichas,
    takeoverDone,
    updateTactics,
    completeReveal,
    confirm,
    justConfirmed,
  } = usePlayoff(date)
  const [statsOpen, setStatsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(() => !hasOnboarded())
  const [mode, setMode] = useState<'daily' | 'gauntlet'>('daily')

  // Cosméticos selecionados (skin aplicado no boot em main.tsx; aqui reaplica ao trocar).
  const [skin, setSkinState] = useState(getSkin)
  const [frame, setFrameState] = useState(getFrame)
  const chooseSkin = (id: string) => {
    setSkin(id)
    applySkin(id)
    setSkinState(id)
  }
  const chooseFrame = (id: string) => {
    setFrame(id)
    setFrameState(id)
  }

  // Guia da prancheta auto-abre só no 1º playoff (decidido no clique de Iniciar).
  const [autoGuide, setAutoGuide] = useState(false)

  const dismissHelp = () => {
    setOnboarded()
    setShowHelp(false)
  }

  // Desafio no hash da URL: só vale "Supere: X" se for do mesmo dia.
  const challenge = useMemo(() => readChallenge(), [])
  const challengeBanner =
    challenge && challenge.date === date ? challengeTarget(challenge.badge) : undefined

  const handleStart = (team: Player[], sixthManId?: string) => {
    if (!hasSeenCoachTip()) {
      setSeenCoachTip()
      setAutoGuide(true) // abre o guia só nesta 1ª vez
    }
    confirm(team, sixthManId) // o resultado é revelado ao fim do playoff gradual
  }

  const handleShare = () => {
    if (!day) return
    void shareText(`${buildShareText(day, stats.streak)}\n${LONGSHOT_URL}`)
  }

  if (mode === 'gauntlet') {
    return <GauntletScreen onExit={() => setMode('daily')} />
  }

  return (
    <>
      {locked && bracket ? (
        <BracketView
          bracket={bracket}
          opponents={draft.bracket}
          team={team}
          level={displayLevel}
          frameRing={frameById(frame).ring}
          gradual={justConfirmed}
          tactics={tactics}
          fichas={fichas}
          sixthMan={sixthMan}
          takeoverDone={takeoverDone}
          onTactic={updateTactics}
          autoOpenGuide={autoGuide}
          onPlayoffEnd={() => {
            completeReveal()
            setStatsOpen(true)
          }}
          onOpenStats={() => setStatsOpen(true)}
          onOpenHelp={() => setShowHelp(true)}
        />
      ) : (
        <DraftScreen
          draft={draft}
          onStartPlayoff={handleStart}
          onOpenStats={() => setStatsOpen(true)}
          onOpenHelp={() => setShowHelp(true)}
          onOpenGauntlet={() => setMode('gauntlet')}
          level={displayLevel}
          challengeTarget={challengeBanner}
        />
      )}

      {statsOpen && (
        <ResultModal
          stats={displayStats}
          day={displayDay}
          level={displayLevel}
          leveledUp={displayLeveledUp}
          todayXp={displayTodayXp}
          skin={skin}
          frame={frame}
          onChooseSkin={chooseSkin}
          onChooseFrame={chooseFrame}
          onShare={handleShare}
          onClose={() => setStatsOpen(false)}
        />
      )}

      {showHelp && <Onboarding onClose={dismissHelp} />}
    </>
  )
}

export default App
