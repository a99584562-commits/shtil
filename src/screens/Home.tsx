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

      {/* groups by time of day */}
      {GROUPS.map((g, gi) => {
        const items = g.ids.map((id) => practiceById(id)).filter(Boolean) as Practice[]
        const isNow = g.key === nowGroup
        return (
          <section
            key={g.key}
            className="mt-9 animate-fadeUp"
            style={{ animationDelay: `${120 + gi * 60}ms` }}
          >
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="font-serif text-lg text-foam/90">{g.label}</h2>
              <span className="text-[11px] text-foam/45">
                {isNow ? 'сейчас' : g.sub}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {items.map((p) => (
                <PracticeCard key={p.id} practice={p} onStart={onOpen} />
              ))}
            </div>
          </section>
        )
      })}

      <p className="pb-safe mt-10 text-center text-[11px] leading-relaxed text-foam/35">
        Не медицинская рекомендация. Просто тихое место, чтобы вернуть внимание себе.
      </p>
    </div>
  )
}
