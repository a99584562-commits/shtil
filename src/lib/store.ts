import { useSyncExternalStore } from 'react'
import type { DiaryEntry, Habit, SessionLog, Settings, WeekReview } from '../types'

const SESSIONS_KEY = 'shtil.sessions.v1'
const SETTINGS_KEY = 'shtil.settings.v1'
const DIARY_KEY = 'shtil.diary.v1'
const HABIT_KEY = 'shtil.habit.v1'
const WEEK_KEY = 'shtil.week.v1'

const DEFAULT_SETTINGS: Settings = {
  ambient: true,
  cueTones: true,
  intervalBell: false,
  reduceMotion: false,
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as object) } as T
  } catch {
    return fallback
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

/** Minimal reactive store backed by localStorage, shared across components. */
function createStore<T>(key: string, initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next: T) => {
      value = next
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* storage full or unavailable — keep in-memory state */
      }
      listeners.forEach((l) => l())
    },
    subscribe: (l: () => void) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

const sessionsStore = createStore<SessionLog[]>(SESSIONS_KEY, readArray<SessionLog>(SESSIONS_KEY))
const settingsStore = createStore<Settings>(SETTINGS_KEY, read(SETTINGS_KEY, DEFAULT_SETTINGS))

export function useSessions(): SessionLog[] {
  return useSyncExternalStore(sessionsStore.subscribe, sessionsStore.get, () => [])
}

export function useSettings(): Settings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, () => DEFAULT_SETTINGS)
}

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set({ ...settingsStore.get(), ...patch })
}

// ---- 6-minute diary ------------------------------------------------------

type DiaryMap = Record<string, DiaryEntry>
const EMPTY_DIARY: DiaryMap = {}
const diaryStore = createStore<DiaryMap>(DIARY_KEY, read(DIARY_KEY, {} as DiaryMap))

export function useDiary(): DiaryMap {
  return useSyncExternalStore(diaryStore.subscribe, diaryStore.get, () => EMPTY_DIARY)
}

export function diaryDayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Merge a patch into a day's entry (morning and/or evening). */
export function saveDiaryEntry(date: string, patch: Partial<DiaryEntry>) {
  const cur = diaryStore.get()
  const existing = cur[date] ?? { date, updatedAt: 0 }
  diaryStore.set({ ...cur, [date]: { ...existing, ...patch, date, updatedAt: Date.now() } })
}

export function entryHasContent(e?: DiaryEntry): boolean {
  if (!e) return false
  const any = (a?: string[]) => !!a && a.some((s) => s.trim().length > 0)
  const m = e.morning
  const ev = e.evening
  return (
    any(m?.gratitude) ||
    any(m?.great) ||
    !!m?.affirmation?.trim() ||
    any(ev?.amazing) ||
    !!ev?.goodDeed?.trim() ||
    !!ev?.better?.trim() ||
    !!ev?.rating
  )
}

/** Consecutive days (ending today or yesterday) with any diary content. */
export function diaryStreak(map: DiaryMap): number {
  const days = new Set(Object.values(map).filter(entryHasContent).map((e) => e.date))
  let streak = 0
  const cursor = new Date()
  if (!days.has(diaryDayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(diaryDayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ---- Habit tracker ("66 days") -------------------------------------------

function readHabit(): Habit | null {
  try {
    const raw = localStorage.getItem(HABIT_KEY)
    return raw ? (JSON.parse(raw) as Habit) : null
  } catch {
    return null
  }
}
const habitStore = createStore<Habit | null>(HABIT_KEY, readHabit())

export function useHabit(): Habit | null {
  return useSyncExternalStore(habitStore.subscribe, habitStore.get, () => null)
}
export function setHabitName(name: string) {
  const cur = habitStore.get()
  habitStore.set(cur ? { ...cur, name } : { name, startedAt: Date.now(), days: {} })
}
export function toggleHabitDay(dateKey: string) {
  const cur = habitStore.get()
  if (!cur) return
  habitStore.set({ ...cur, days: { ...cur.days, [dateKey]: !cur.days[dateKey] } })
}
export function clearHabit() {
  habitStore.set(null)
}
export function habitDoneCount(h: Habit | null): number {
  return h ? Object.values(h.days).filter(Boolean).length : 0
}

// ---- Weekly review -------------------------------------------------------

type WeekMap = Record<string, WeekReview>
const EMPTY_WEEK: WeekMap = {}
const weekStore = createStore<WeekMap>(WEEK_KEY, read(WEEK_KEY, {} as WeekMap))

export function useWeekReviews(): WeekMap {
  return useSyncExternalStore(weekStore.subscribe, weekStore.get, () => EMPTY_WEEK)
}
/** Day-key of the Monday that starts the week containing `d`. */
export function mondayKey(d = new Date()): string {
  const x = new Date(d)
  const off = (x.getDay() + 6) % 7 // Mon=0 … Sun=6
  x.setDate(x.getDate() - off)
  return diaryDayKey(x)
}
export function saveWeekReview(week: string, patch: Partial<WeekReview>) {
  const cur = weekStore.get()
  const existing = cur[week] ?? { week, good: '', learned: '', change: '', updatedAt: 0 }
  weekStore.set({ ...cur, [week]: { ...existing, ...patch, week, updatedAt: Date.now() } })
}

export function logSession(entry: Omit<SessionLog, 'id' | 'ts'>) {
  // Ignore trivially short sessions (e.g. opened and closed instantly).
  if (entry.seconds < 5) return
  const ts = Date.now()
  const log: SessionLog = { ...entry, id: `${ts}-${Math.round(entry.seconds)}`, ts }
  sessionsStore.set([log, ...sessionsStore.get()])
}

// ---- Derived stats -------------------------------------------------------

function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export interface Stats {
  streak: number
  totalSessions: number
  totalMinutes: number
  todaySessions: number
  practiced: Set<string> // dayKeys with at least one session
}

export function computeStats(sessions: SessionLog[]): Stats {
  const practiced = new Set(sessions.map((s) => dayKey(s.ts)))
  const totalSeconds = sessions.reduce((sum, s) => sum + s.seconds, 0)
  const todayKey = dayKey(Date.now())
  const todaySessions = sessions.filter((s) => dayKey(s.ts) === todayKey).length

  // Streak: consecutive days (ending today or yesterday) with a session.
  let streak = 0
  const cursor = new Date()
  // Allow the streak to still count if nothing done yet today but yesterday was.
  if (!practiced.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (practiced.has(dayKey(cursor.getTime()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    streak,
    totalSessions: sessions.length,
    totalMinutes: Math.round(totalSeconds / 60),
    todaySessions,
    practiced,
  }
}
