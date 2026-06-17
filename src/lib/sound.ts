/**
 * Sons sintetizados (Web Audio) — sem dependência, sem assets. Curtos jingles para
 * vitória/level-up/conquista. Mudo persistente; respeita o gesto do usuário (a sim
 * só toca depois de interações). Nada disso vive no engine.
 */
const MUTE_KEY = 'longshot:muted:v1'

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // ignora
  }
}

/** Alterna o mudo e devolve o novo estado. */
export function toggleMuted(): boolean {
  const next = !isMuted()
  setMuted(next)
  return next
}

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || isMuted()) return null
  try {
    ctx = ctx ?? new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface Note {
  /** Frequência (Hz). */
  f: number
  /** Início (s, relativo). */
  t: number
  /** Duração (s). */
  d: number
}

function play(notes: Note[], type: OscillatorType = 'triangle'): void {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  for (const n of notes) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.value = n.f
    gain.gain.setValueAtTime(0.0001, now + n.t)
    gain.gain.exponentialRampToValueAtTime(0.2, now + n.t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d)
    osc.connect(gain).connect(ac.destination)
    osc.start(now + n.t)
    osc.stop(now + n.t + n.d + 0.03)
  }
}

/** Fanfarra do campeão (acorde ascendente). */
export const playChampion = (): void =>
  play([
    { f: 523, t: 0, d: 0.16 },
    { f: 659, t: 0.12, d: 0.16 },
    { f: 784, t: 0.24, d: 0.16 },
    { f: 1047, t: 0.36, d: 0.34 },
  ])

/** Subiu de nível. */
export const playLevelUp = (): void =>
  play([
    { f: 660, t: 0, d: 0.1 },
    { f: 880, t: 0.1, d: 0.2 },
  ])

/** Conquista desbloqueada. */
export const playUnlock = (): void =>
  play([
    { f: 740, t: 0, d: 0.1 },
    { f: 988, t: 0.1, d: 0.18 },
  ])
