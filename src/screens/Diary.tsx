import { useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { TopBar } from '../components/TopBar'
import { SunIcon, MoonIcon, JournalIcon, PenIcon, FlameIcon, CheckIcon } from '../components/Icons'
import {
  diaryDayKey,
  diaryStreak,
  saveDiaryEntry,
  useDiary,
  useHabit,
  setHabitName,
  toggleHabitDay,
  habitDoneCount,
  clearHabit,
  useWeekReviews,
  saveWeekReview,
  mondayKey,
} from '../lib/store'
import type { DiaryEntry, DiaryEvening, DiaryMorning, TimeOfDay } from '../types'

type Tab = 'morning' | 'evening'
type Mode = 'write' | 'review'

const HABIT_GOAL = 66
const pad3 = (a?: string[]): string[] => [a?.[0] ?? '', a?.[1] ?? '', a?.[2] ?? '']

const FOCUS = [
  'Маленькие шаги каждый день важнее редких рывков.',
  'Замечай хорошее — оно уже рядом.',
  'Ты не обязан быть продуктивным, чтобы быть достаточным.',
  'Одно спокойное дыхание возвращает тебя в момент.',
  'Благодарность — это внимание к тому, что уже есть.',
  'Сегодняшний день не повторится. Побудь в нём.',
  'Прогресс, а не совершенство.',
]

const inputStyle = { background: 'rgba(207,238,240,0.05)', border: '1px solid rgba(207,238,240,0.1)' }
function inputCls(extra = '') {
  return (
    'w-full rounded-xl px-3.5 py-2.5 text-[15px] text-foam placeholder:text-foam/25 outline-none ' +
    'transition-colors duration-200 focus:bg-[rgba(207,238,240,0.10)] ' +
    extra
  )
}

function Field({
  value,
  onChange,
  placeholder,
  index,
  multiline,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  index?: number
  multiline?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      {index != null && (
        <span className="mt-2.5 w-4 shrink-0 text-center font-serif text-[14px] text-foam/35">{index}</span>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={inputCls('resize-none')}
          style={inputStyle}
        />
      ) : (
        <input
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={inputCls()}
          style={inputStyle}
        />
      )}
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] p-1.5 glass">
      <div className="rounded-[1.375rem] px-4 py-4">
        <div className="mb-3 flex items-baseline gap-2">
          <h3 className="font-serif text-[17px] tracking-tight text-foam">{title}</h3>
          {hint && <span className="text-[11px] text-foam/40">{hint}</span>}
        </div>
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  )
}

function defaultTab(time: TimeOfDay): Tab {
  return time === 'evening' || time === 'night' ? 'evening' : 'morning'
}

// ---- Habit tracker -------------------------------------------------------

function HabitCard() {
  const habit = useHabit()
  const todayKey = diaryDayKey()
  const [editing, setEditing] = useState(!habit)
  const [draft, setDraft] = useState(habit?.name ?? '')

  if (!habit || editing) {
    return (
      <Section title="Привычка" hint="формируем за 66 дней">
        <Field value={draft} onChange={setDraft} placeholder="например, 10 минут чтения" />
        <button
          onClick={() => {
            if (draft.trim()) {
              setHabitName(draft.trim())
              setEditing(false)
            }
          }}
          className="mt-1 self-start rounded-full px-5 py-2.5 text-sm font-medium text-sea-900 transition-all duration-500 ease-fluid active:scale-95"
          style={{ background: 'linear-gradient(180deg,#eafcfb,#9fe6e1)' }}
        >
          {habit ? 'Сохранить' : 'Начать привычку'}
        </button>
        {habit && (
          <button onClick={() => setEditing(false)} className="self-start px-1 text-[12px] text-foam/45">
            отмена
          </button>
        )}
      </Section>
    )
  }

  const done = habitDoneCount(habit)
  const todayDone = !!habit.days[todayKey]
  const pct = Math.min(done / HABIT_GOAL, 1) * 100

  return (
    <div className="rounded-[1.75rem] p-1.5 glass">
      <div className="rounded-[1.375rem] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-foam/40">Привычка · {done} из {HABIT_GOAL} дней</p>
            <h3 className="mt-1 truncate font-serif text-[18px] tracking-tight text-foam">{habit.name}</h3>
          </div>
          <button
            onClick={() => toggleHabitDay(todayKey)}
            aria-label={todayDone ? 'Сегодня сделано' : 'Отметить сегодня'}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full transition-all duration-300 ease-fluid active:scale-90"
            style={{
              background: todayDone ? 'rgba(95,214,208,0.85)' : 'rgba(207,238,240,0.06)',
              border: `1px solid ${todayDone ? 'transparent' : 'rgba(207,238,240,0.18)'}`,
              color: todayDone ? '#06222b' : 'rgba(207,238,240,0.6)',
            }}
          >
            <CheckIcon width={22} height={22} />
          </button>
        </div>

        {/* progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(207,238,240,0.08)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-fluid"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#5fd6d0,#9fe6e1)' }}
          />
        </div>

        <div className="mt-3 flex gap-3">
          <button onClick={() => { setDraft(habit.name); setEditing(true) }} className="text-[12px] text-foam/45">
            изменить
          </button>
          <button
            onClick={() => { if (confirm('Сбросить привычку и прогресс?')) clearHabit() }}
            className="text-[12px] text-foam/35"
          >
            сбросить
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Day rating ----------------------------------------------------------

function RatingRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value >= n
        return (
          <button
            key={n}
            onClick={() => onChange(value === n ? 0 : n)}
            className="grid h-10 w-10 place-items-center rounded-full font-serif text-[15px] transition-all duration-300 ease-fluid active:scale-90"
            style={{
              background: on ? 'rgba(95,214,208,0.22)' : 'rgba(207,238,240,0.05)',
              border: `1px solid ${on ? 'rgba(95,214,208,0.5)' : 'rgba(207,238,240,0.1)'}`,
              color: on ? '#bdeeea' : 'rgba(207,238,240,0.5)',
            }}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

export function Diary({ time, onBack }: { time: TimeOfDay; onBack: () => void }) {
  const diary = useDiary()
  const todayKey = diaryDayKey()
  const todayEntry = diary[todayKey]
  const streak = diaryStreak(diary)

  const [mode, setMode] = useState<Mode>('write')
  const [tab, setTab] = useState<Tab>(defaultTab(time))

  const [morning, setMorning] = useState<DiaryMorning>(() => ({
    gratitude: pad3(todayEntry?.morning?.gratitude),
    great: pad3(todayEntry?.morning?.great),
    affirmation: todayEntry?.morning?.affirmation ?? '',
  }))
  const [evening, setEvening] = useState<DiaryEvening>(() => ({
    goodDeed: todayEntry?.evening?.goodDeed ?? '',
    amazing: pad3(todayEntry?.evening?.amazing),
    better: todayEntry?.evening?.better ?? '',
    rating: todayEntry?.evening?.rating ?? 0,
  }))

  const focus = useMemo(() => {
    const d = new Date()
    return FOCUS[(d.getFullYear() + d.getMonth() * 31 + d.getDate()) % FOCUS.length]
  }, [])
  const dateLabel = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  const saveMorning = (next: DiaryMorning) => {
    setMorning(next)
    saveDiaryEntry(todayKey, { morning: next })
  }
  const saveEvening = (next: DiaryEvening) => {
    setEvening(next)
    saveDiaryEntry(todayKey, { evening: next })
  }
  const setList = (arr: string[], i: number, v: string) => arr.map((x, idx) => (idx === i ? v : x))

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] px-5 pb-16">
      <TopBar
        onBack={onBack}
        title="6 минут"
        right={
          <button
            onClick={() => setMode((m) => (m === 'write' ? 'review' : 'write'))}
            aria-label={mode === 'write' ? 'Обзор' : 'Запись'}
            className="grid h-10 w-10 place-items-center rounded-full text-foam/75 transition-all duration-500 ease-fluid active:scale-95 glass"
          >
            {mode === 'write' ? <JournalIcon /> : <PenIcon />}
          </button>
        }
      />

      {mode === 'write' ? (
        <div className="mt-2 animate-fadeUp">
          <div className="flex items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <h1 className="font-serif text-[30px] leading-tight tracking-tight text-foam">Дневник 6 минут</h1>
              <p className="mt-1 text-[12.5px] capitalize text-foam/45">{dateLabel}</p>
            </div>
            {streak > 0 && (
              <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 glass">
                <FlameIcon width={14} height={14} className="text-glow-dawn" />
                <span className="text-[12px] font-medium text-foam/80">{streak} дн.</span>
              </div>
            )}
          </div>
          <p className="mt-3 px-1 font-serif text-[15px] italic leading-snug text-foam/55">«{focus}»</p>

          <div className="mt-5">
            <HabitCard />
          </div>

          {/* morning / evening toggle */}
          <div className="relative mt-4 grid grid-cols-2 rounded-full p-1 glass">
            <span
              aria-hidden
              className="absolute bottom-1 top-1 rounded-full glass-strong transition-transform duration-500 ease-fluid"
              style={{ left: 4, width: 'calc((100% - 8px) / 2)', transform: `translateX(${tab === 'evening' ? '100%' : '0'})` }}
            />
            {([
              { key: 'morning', label: 'Утро', Icon: SunIcon },
              { key: 'evening', label: 'Вечер', Icon: MoonIcon },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-medium transition-colors duration-300 ${
                  tab === key ? 'text-foam' : 'text-foam/55'
                }`}
              >
                <Icon width={15} height={15} />
                {label}
              </button>
            ))}
          </div>

          <div key={tab} className="mt-4 flex animate-fadeUp flex-col gap-3">
            {tab === 'morning' ? (
              <>
                <Section title="За что я благодарен" hint="3 пункта">
                  {morning.gratitude.map((v, i) => (
                    <Field key={i} index={i + 1} value={v} placeholder={i === 0 ? 'например, за утренний кофе' : '…'}
                      onChange={(val) => saveMorning({ ...morning, gratitude: setList(morning.gratitude, i, val) })} />
                  ))}
                </Section>
                <Section title="Что сделает день прекрасным" hint="3 пункта">
                  {morning.great.map((v, i) => (
                    <Field key={i} index={i + 1} value={v} placeholder={i === 0 ? 'один маленький шаг' : '…'}
                      onChange={(val) => saveMorning({ ...morning, great: setList(morning.great, i, val) })} />
                  ))}
                </Section>
                <Section title="Я…" hint="самоутверждение">
                  <Field value={morning.affirmation} placeholder="Я спокоен и справлюсь с тем, что важно"
                    onChange={(val) => saveMorning({ ...morning, affirmation: val })} />
                </Section>
              </>
            ) : (
              <>
                <Section title="Доброе дело дня" hint="что хорошего я сделал">
                  <Field value={evening.goodDeed} placeholder="помог, поддержал, поблагодарил…"
                    onChange={(val) => saveEvening({ ...evening, goodDeed: val })} />
                </Section>
                <Section title="Что прекрасного случилось сегодня" hint="3 пункта">
                  {evening.amazing.map((v, i) => (
                    <Field key={i} index={i + 1} value={v} placeholder={i === 0 ? 'маленький приятный момент' : '…'}
                      onChange={(val) => saveEvening({ ...evening, amazing: setList(evening.amazing, i, val) })} />
                  ))}
                </Section>
                <Section title="Как сделать день ещё лучше" hint="мягко, без критики">
                  <Field value={evening.better} placeholder="что я попробую завтра"
                    onChange={(val) => saveEvening({ ...evening, better: val })} />
                </Section>
                <Section title="Оценка дня" hint="как прошёл день">
                  <RatingRow value={evening.rating ?? 0} onChange={(r) => saveEvening({ ...evening, rating: r })} />
                </Section>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-[11px] text-foam/35">Сохраняется автоматически</p>
        </div>
      ) : (
        <ReviewView diary={diary} />
      )}
    </div>
  )
}

// ---- Review: mood chart + weekly review + history ------------------------

function hasContent(arr?: string[], ...extra: (string | undefined)[]): boolean {
  return [...(arr ?? []), ...extra].some((s) => s && s.trim().length > 0)
}
function fmtDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function MoodChart({ diary }: { diary: Record<string, DiaryEntry> }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return diary[diaryDayKey(d)]?.evening?.rating ?? 0
  })
  const pts = days.map((r, i) => ({ i, r })).filter((p) => p.r > 0)
  const W = 320
  const H = 96
  const x = (i: number) => 8 + (i / 13) * (W - 16)
  const y = (r: number) => 10 + (1 - (r - 1) / 4) * (H - 28)
  const line = pts.map((p) => `${x(p.i).toFixed(1)},${y(p.r).toFixed(1)}`).join(' ')
  const area = pts.length ? `8,${H - 18} ${line} ${x(pts[pts.length - 1].i).toFixed(1)},${H - 18}` : ''

  return (
    <div className="rounded-[1.75rem] p-1.5 glass">
      <div className="rounded-[1.375rem] px-4 py-4">
        <p className="eyebrow text-foam/45">Настроение · 2 недели</p>
        {pts.length < 2 ? (
          <p className="mt-3 text-[13px] leading-snug text-foam/45">
            Оценивай день вечером — здесь появится график динамики.
          </p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5fd6d0" stopOpacity="0.35" />
                <stop offset="1" stopColor="#5fd6d0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill="url(#moodFill)" />
            <polyline points={line} fill="none" stroke="#7fe3dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p) => (
              <circle key={p.i} cx={x(p.i)} cy={y(p.r)} r="3" fill="#bdeeea" />
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}

function WeekReviewCard() {
  const weeks = useWeekReviews()
  const wk = mondayKey()
  const existing = weeks[wk]
  const [draft, setDraft] = useState(() => ({
    good: existing?.good ?? '',
    learned: existing?.learned ?? '',
    change: existing?.change ?? '',
  }))
  const update = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    saveWeekReview(wk, next)
  }
  return (
    <div className="flex flex-col gap-3">
      <Section title="Что порадовало на этой неделе">
        <Field value={draft.good} multiline placeholder="моменты, люди, маленькие победы"
          onChange={(v) => update({ good: v })} />
      </Section>
      <Section title="Что я усвоил">
        <Field value={draft.learned} multiline placeholder="вывод или урок недели"
          onChange={(v) => update({ learned: v })} />
      </Section>
      <Section title="Что хочется изменить">
        <Field value={draft.change} multiline placeholder="один мягкий шаг на следующую неделю"
          onChange={(v) => update({ change: v })} />
      </Section>
    </div>
  )
}

function Lines({ items }: { items: (string | undefined)[] }) {
  const filled = items.filter((s): s is string => !!s && s.trim().length > 0)
  if (!filled.length) return null
  return (
    <ul className="mt-1 flex flex-col gap-0.5">
      {filled.map((s, i) => (
        <li key={i} className="text-[13.5px] leading-snug text-foam/75">{s}</li>
      ))}
    </ul>
  )
}

function ReviewView({ diary }: { diary: Record<string, DiaryEntry> }) {
  const entries = Object.values(diary)
    .filter(
      (e) =>
        hasContent(e.morning?.gratitude, e.morning?.affirmation) ||
        hasContent(e.morning?.great) ||
        hasContent(e.evening?.amazing, e.evening?.goodDeed, e.evening?.better) ||
        !!e.evening?.rating,
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="mt-2 animate-fadeUp">
      <h1 className="px-1 font-serif text-[30px] leading-tight tracking-tight text-foam">Обзор</h1>

      <div className="mt-4">
        <MoodChart diary={diary} />
      </div>

      <h2 className="mt-7 px-1 font-serif text-lg tracking-tight text-foam/90">Итоги недели</h2>
      <div className="mt-3">
        <WeekReviewCard />
      </div>

      <h2 className="mt-7 px-1 font-serif text-lg tracking-tight text-foam/90">История</h2>
      {entries.length === 0 ? (
        <p className="mt-3 px-1 text-[13.5px] leading-relaxed text-foam/50">
          Здесь будут твои записи. Начни с пары строк утром или вечером — этого достаточно.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {entries.map((e) => (
            <div key={e.date} className="rounded-[1.75rem] p-1.5 glass">
              <div className="rounded-[1.375rem] px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-[16px] capitalize tracking-tight text-foam">{fmtDate(e.date)}</p>
                  {!!e.evening?.rating && (
                    <span className="text-[12px] text-glow-cyan">{e.evening.rating}/5</span>
                  )}
                </div>
                {e.morning && hasContent(e.morning.gratitude, e.morning.affirmation, ...e.morning.great) && (
                  <div className="mt-3">
                    <p className="eyebrow text-glow-cyan/70">Утро</p>
                    {hasContent(e.morning.gratitude) && (
                      <>
                        <p className="mt-2 text-[11.5px] text-foam/45">Благодарность</p>
                        <Lines items={e.morning.gratitude} />
                      </>
                    )}
                    {hasContent(e.morning.great) && (
                      <>
                        <p className="mt-2 text-[11.5px] text-foam/45">Сделает день прекрасным</p>
                        <Lines items={e.morning.great} />
                      </>
                    )}
                    {e.morning.affirmation?.trim() && (
                      <p className="mt-2 text-[13.5px] italic leading-snug text-foam/75">«{e.morning.affirmation}»</p>
                    )}
                  </div>
                )}
                {e.evening && hasContent(e.evening.amazing, e.evening.goodDeed, e.evening.better) && (
                  <div className="mt-3 border-t border-foam/10 pt-3">
                    <p className="eyebrow text-glow-dawn/70">Вечер</p>
                    {e.evening.goodDeed?.trim() && (
                      <>
                        <p className="mt-2 text-[11.5px] text-foam/45">Доброе дело</p>
                        <p className="text-[13.5px] leading-snug text-foam/75">{e.evening.goodDeed}</p>
                      </>
                    )}
                    {hasContent(e.evening.amazing) && (
                      <>
                        <p className="mt-2 text-[11.5px] text-foam/45">Прекрасное за день</p>
                        <Lines items={e.evening.amazing} />
                      </>
                    )}
                    {e.evening.better?.trim() && (
                      <>
                        <p className="mt-2 text-[11.5px] text-foam/45">Сделать лучше</p>
                        <p className="text-[13.5px] leading-snug text-foam/75">{e.evening.better}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
