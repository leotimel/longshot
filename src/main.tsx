import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applySkin } from './lib/skins'
import { getSkin } from './lib/storage'

// Aplica o skin escolhido antes do render (evita flash do tema default).
applySkin(getSkin())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
