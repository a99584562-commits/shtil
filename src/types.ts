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

// "6-minute diary" (Dominik Spenst) — 3 min morning + 3 min evening.
export interface DiaryMorning {
  gratitude: string[] // 3 — за что я благодарен
  great: string[] // 3 — что сделает день прекрасным
  affirmation: string // позитивное самоутверждение
}

export interface DiaryEvening {
  goodDeed: string // доброе дело дня
  amazing: string[] // 3 — что прекрасного случилось
  better: string // как сделать день ещё лучше
  rating?: number // оценка дня 1–5 (0/undefined — не задано)
}

// Single habit being built alongside the diary (the book's "66 days" idea).
export interface Habit {
  name: string
  startedAt: number
  days: Record<string, boolean> // dayKey -> done
}

// Weekly reflection (Wochenrückblick), keyed by the week's Monday day-key.
export interface WeekReview {
  week: string
  good: string // что порадовало
  learned: string // что усвоил
  change: string // что хочется изменить
  updatedAt: number
}

export interface DiaryEntry {
  date: string // day key 'YYYY-M-D'
  morning?: DiaryMorning
  evening?: DiaryEvening
  updatedAt: number
}
