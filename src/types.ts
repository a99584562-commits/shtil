export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

export type PracticeKind = 'breathing' | 'timer' | 'grounding' | 'pause'

/** One step of a breathing pattern. scale 0 = fully contracted, 1 = fully expanded. */
export interface BreathPhase {
  label: string
  seconds: number
  scaleTo: number
}

export interface Practice {
  id: string
  kind: PracticeKind
  title: string
  tagline: string
  /** Minutes, rough — shown as a hint, not a hard limit. */
  minutes: number
  /** Which parts of the day this practice fits best. */
  times: TimeOfDay[]
  /** Short, accurate note on the evidence behind it. */
  science: string
  /** Optional pattern for breathing practices. */
  pattern?: BreathPhase[]
  /** Suggested number of cycles for breathing practices. */
  cycles?: number
  /** Gentle guidance lines, slowly cycled during timer practices. */
  guide?: string[]
  accent: 'cyan' | 'sky' | 'dawn'
}

export interface SessionLog {
  id: string
  practiceId: string
  kind: PracticeKind
  /** Whole seconds actually practised. */
  seconds: number
  /** Epoch ms. */
  ts: number
}

export interface Settings {
  ambient: boolean
  cueTones: boolean
  intervalBell: boolean
  reduceMotion: boolean
}
