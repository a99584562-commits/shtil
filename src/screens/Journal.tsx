import { TopBar } from '../components/TopBar'
import { computeStats, useSessions } from '../lib/store'
import { practiceById } from '../data/practices'
import { FlameIcon } from '../components/Icons'

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function relativeDay(ts: number): string {
  const now = new Date()
  const d = new Date(ts)
  const todayK = dayKey(now)
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (dayKey(d) === todayK) return 'сегодня'
  if (dayKey(d) === dayKey(y)) return 'вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function Journal({ onBack }: { onBack: () => void }) {
  const sessions = useSessions()
  const stats = computeStats(sessions)

  // last 14 days, oldest → newest
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return { date: d, active: stats.practiced.has(dayKey(d)) }
  })

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] px-5 pb-16">
      <TopBar onBack={onBack} title="Дневник" />

      <div className="mt-4 animate-fadeUp">
        <h1 className="px-1 font-serif text-[30px] leading-tight text-foam">Твоя практика</h1>

        {/* stat trio */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat value={stats.streak} label="дней подряд" flame />
          <Stat value={stats.totalSessions} label="всего сессий" />
          <Stat value={stats.totalMinutes} label="минут с собой" />
        </div>

        {/* last 14 days as a calm 7×2 grid */}
        <div className="mt-4 rounded-[2rem] p-1.5 glass">
          <div className="rounded-[1.625rem] px-4 py-5">
            <p className="eyebrow text-foam/45">Последние 2 недели</p>
            <div className="mt-4 grid grid-cols-7 gap-y-3">
              {days.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full text-[12px] transition-all duration-500 ease-fluid"
                    style={{
                      background: d.active ? 'rgba(95,214,208,0.85)' : 'rgba(207,238,240,0.06)',
                      color: d.active ? '#06222b' : 'rgba(207,238,240,0.4)',
                      border: d.active ? 'none' : '1px solid rgba(207,238,240,0.1)',
                    }}
                  >
                    {d.date.getDate()}
                  </span>
                  <span className="text-[9px] text-foam/35">{WD[d.date.getDay()]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* history */}
        <h2 className="mt-8 px-1 font-serif text-lg text-foam/90">История</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 px-1 text-[13.5px] leading-relaxed text-foam/50">
            Пока пусто. Сделай первую практику — и она появится здесь. Даже одна минута считается.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {sessions.slice(0, 12).map((s) => {
              const p = practiceById(s.practiceId)
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 glass"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-foam/90">{p?.title ?? 'Практика'}</p>
                    <p className="text-[11.5px] text-foam/45">{relativeDay(s.ts)}</p>
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-foam/55">
                    {s.seconds >= 60 ? `${Math.round(s.seconds / 60)} мин` : `${s.seconds} сек`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ value, label, flame }: { value: number; label: string; flame?: boolean }) {
  return (
    <div className="rounded-[1.5rem] p-1.5 glass">
      <div className="rounded-[1.125rem] px-3 py-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {flame && value > 0 && <FlameIcon width={16} height={16} className="text-glow-dawn" />}
          <span className="font-serif text-3xl text-foam">{value}</span>
        </div>
        <p className="mt-1 text-[10.5px] leading-tight text-foam/45">{label}</p>
      </div>
    </div>
  )
}
