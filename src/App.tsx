import { useMemo, useState } from 'react'
import { dailyDraft } from './engine/draft'
import { simulateBracket } from './engine/bracket'
import { DraftScreen } from './components/DraftScreen'
import { BracketView } from './components/BracketView'

/** Data local de hoje no formato YYYY-MM-DD. */
function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function App() {
  const date = todayISO()
  const draft = useMemo(() => dailyDraft(date), [date])
  const [picks, setPicks] = useState<number[] | null>(null)

  // O bracket inteiro já é calculado pelo motor; a UI só navega.
  const bracket = useMemo(
    () =>
      picks
        ? simulateBracket(
            draft.playerPool.map((pair, i) => pair[picks[i]]),
            date,
            picks,
          )
        : null,
    [picks, draft, date],
  )

  if (picks && bracket) {
    // Sem persistência ainda — a trava real do draft vem na Fase 4.1.
    return <BracketView bracket={bracket} opponents={draft.bracket} onExit={() => setPicks(null)} />
  }

  return <DraftScreen draft={draft} onStartPlayoff={setPicks} />
}

export default App
