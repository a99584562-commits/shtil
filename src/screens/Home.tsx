import { useState } from 'react'
import { PRACTICES, practiceById } from '../data/practices'
import { greeting, subline } from '../lib/time'
import { computeStats, useSessions } from '../lib/store'
import type { Practice, TimeOfDay } from '../types'
import { PracticeCard } from '../components/PracticeCard'
import { FlameIcon, JournalIcon, InfoIcon, CircleIcon } from '../components/Icons'

const GROUPS: { key: TimeOfDay; label: string; sub: string; ids: string[] }[] = [
  { key: 'morning', label: 'Утро', sub: 'ясность и заряд', ids: ['coherent', 'anchor'] },
  { key: 'day', label: 'День', sub: 'сброс стресса и фокус', ids: ['box', 'ground', 'pause'] },
  { key: 'evening', label: 'Вечер', sub: 'замедлиться и уснуть', ids: ['relax478', 'bodyscan'] },
]

const SUGGESTION: Record<TimeOfDay, string> = {
  morning: 'coherent',
  day: 'box',
  evening: 'relax478',
  night: 'relax478',
}

// 'night' shares the evening group for display purposes.
function displayGroup(t: TimeOfDay): TimeOfDay {
  return t === 'night' ? 'evening' : t
}

export function Home({
  time,
  onOpen,
  onJournal,
  onAbout,
}: {
  time: TimeOfDay
  onOpen: (p: Practice) => void
  onJournal: () => void
  onAbout: () => void
}) {
  const sessions = useSessions()
  const stats = computeStats(sessions)
  const suggested = practiceById(SUGGESTION[time]) ?? PRACTICES[0]
  const nowGroup = displayGroup(time)

  // Segmented tabs instead of a long scroll — default to the current part of day.
  const [tab, setTab] = useState<TimeOfDay>(nowGroup)
  const activeIndex = GROUPS.findIndex((g) => g.key === tab)
  const activeGroup = GROUPS[activeIndex] ?? GROUPS[0]
  const items = activeGroup.ids.map((id) => practiceById(id)).filter(Boolean) as Practice[]

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] px-5 pb-16">
      {/* header */}
      <header className="pt-safe flex items-start justify-between">
        <div className="animate-fadeUp">
          <p className="eyebrow text-foam/45">{greeting(time)}</p>
          <h1 className="mt-1 font-serif text-[34px] leading-[1.05] tracking-tight text-foam">Штиль</h1>
          <p className="mt-2 max-w-[17rem] font-serif text-[15px] italic leading-snug text-foam/60">
            {subline(time)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={onJournal}
              aria-label="Дневник"
              className="grid h-10 w-10 place-items-center rounded-full text-foam/75 transition-all duration-500 ease-fluid active:scale-95 glass"
            >
              <JournalIcon />
            </button>
            <button
              onClick={onAbout}
              aria-label="О практиках и настройки"
              className="grid h-10 w-10 place-items-center rounded-full text-foam/75 transition-all duration-500 ease-fluid active:scale-95 glass"
            >
              <InfoIcon />
            </button>
          </div>
          {stats.streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 glass">
              <FlameIcon width={14} height={14} className="text-glow-dawn" />
              <span className="text-[12px] font-medium text-foam/80">{stats.streak} дн.</span>
            </div>
          )}
        </div>
      </header>

      {/* suggestion */}
      <section className="mt-8 animate-fadeUp" style={{ animationDelay: '60ms' }}>
        <div className="mb-3 flex items-center gap-2 px-1">
          <CircleIcon width={14} height={14} className="text-glow-cyan" />
          <span className="eyebrow text-foam/50">Сейчас уместно</span>
        </div>
        <PracticeCard practice={suggested} onStart={onOpen} prominent />
      </section>

      {/* practices by time of day — segmented, only the chosen part is shown */}
      <section className="mt-9 animate-fadeUp" style={{ animationDelay: '120ms' }}>
        <div className="relative grid grid-cols-3 rounded-full p-1 glass">
          <span
            aria-hidden
            className="absolute bottom-1 top-1 rounded-full glass-strong transition-transform duration-500 ease-fluid"
            style={{ left: 4, width: 'calc((100% - 8px) / 3)', transform: `translateX(${activeIndex * 100}%)` }}
          />
          {GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setTab(g.key)}
              className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-medium transition-colors duration-300 ${
                tab === g.key ? 'text-foam' : 'text-foam/55'
              }`}
            >
              {g.label}
              {g.key === nowGroup && (
                <span className="h-1.5 w-1.5 rounded-full bg-glow-cyan" />
              )}
            </button>
          ))}
        </div>

        <div className="mb-3 mt-4 flex items-baseline justify-between px-1">
          <h2 className="font-serif text-lg tracking-tight text-foam/90">{activeGroup.label}</h2>
          <span className="text-[11px] text-foam/45">
            {activeGroup.key === nowGroup ? 'сейчас' : activeGroup.sub}
          </span>
        </div>

        <div key={tab} className="flex flex-col gap-3 animate-fadeUp">
          {items.map((p) => (
            <PracticeCard key={p.id} practice={p} onStart={onOpen} />
          ))}
        </div>
      </section>

      <p className="pb-safe mt-10 text-center text-[11px] leading-relaxed text-foam/35">
        Не медицинская рекомендация. Просто тихое место, чтобы вернуть внимание себе.
      </p>
    </div>
  )
}
