import { useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { TopBar } from '../components/TopBar'
import { SunIcon, MoonIcon, JournalIcon, PenIcon } from '../components/Icons'
import { diaryDayKey, saveDiaryEntry, useDiary } from '../lib/store'
import type { DiaryEntry, DiaryEvening, DiaryMorning, TimeOfDay } from '../types'

type Tab = 'morning' | 'evening'
type Mode = 'write' | 'history'

const pad3 = (a?: string[]): string[] => [a?.[0] ?? '', a?.[1] ?? '', a?.[2] ?? '']

// A small daily focus, deterministic by date — the "thought of the day".
const FOCUS = [
  'Маленькие шаги каждый день важнее редких рывков.',
  'Замечай хорошее — оно уже рядом.',
  'Ты не обязан быть продуктивным, чтобы быть достаточным.',
  'Одно спокойное дыхание возвращает тебя в момент.',
  'Благодарность — это внимание к тому, что уже есть.',
  'Сегодняшний день не повторится. Побудь в нём.',
  'Прогресс, а не совершенство.',
]

function inputCls(extra = '') {
  return (
    'w-full rounded-xl px-3.5 py-2.5 text-[15px] text-foam placeholder:text-foam/25 outline-none ' +
    'transition-colors duration-200 focus:bg-[rgba(207,238,240,0.10)] ' +
    extra
  )
}
const inputStyle = { background: 'rgba(207,238,240,0.05)', border: '1px solid rgba(207,238,240,0.1)' }

function Field({
  value,
  onChange,
  placeholder,
  index,
  readOnly,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  index?: number
  readOnly?: boolean
}) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)
  return (
    <div className="flex items-center gap-2.5">
      {index != null && (
        <span className="w-4 shrink-0 text-center font-serif text-[14px] text-foam/35">{index}</span>
      )}
      <input
        value={value}
        onChange={handle}
        placeholder={placeholder}
        readOnly={readOnly}
        className={inputCls(readOnly ? 'cursor-default' : '')}
        style={inputStyle}
      />
    </div>
  )
}

function Section({
  title,
  hint,
  icon,
  children,
}: {
  title: string
  hint?: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-[1.75rem] p-1.5 glass">
      <div className="rounded-[1.375rem] px-4 py-4">
        <div className="mb-3 flex items-baseline gap-2">
          <h3 className="font-serif text-[17px] tracking-tight text-foam">{title}</h3>
          {hint && <span className="text-[11px] text-foam/40">{hint}</span>}
          {icon}
        </div>
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  )
}

function defaultTab(time: TimeOfDay): Tab {
  return time === 'evening' || time === 'night' ? 'evening' : 'morning'
}

export function Diary({ time, onBack }: { time: TimeOfDay; onBack: () => void }) {
  const diary = useDiary()
  const todayKey = diaryDayKey()
  const todayEntry = diary[todayKey]

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
  }))

  const focus = useMemo(() => {
    const d = new Date()
    return FOCUS[(d.getFullYear() + d.getMonth() * 31 + d.getDate()) % FOCUS.length]
  }, [])

  const dateLabel = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

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
            onClick={() => setMode((m) => (m === 'write' ? 'history' : 'write'))}
            aria-label={mode === 'write' ? 'История' : 'Запись'}
            className="grid h-10 w-10 place-items-center rounded-full text-foam/75 transition-all duration-500 ease-fluid active:scale-95 glass"
          >
            {mode === 'write' ? <JournalIcon /> : <PenIcon />}
          </button>
        }
      />

      {mode === 'write' ? (
        <div className="mt-2 animate-fadeUp">
          <h1 className="px-1 font-serif text-[30px] leading-tight tracking-tight text-foam">
            Дневник 6 минут
          </h1>
          <p className="mt-1 px-1 text-[12.5px] capitalize text-foam/45">{dateLabel}</p>
          <p className="mt-3 px-1 font-serif text-[15px] italic leading-snug text-foam/55">
            «{focus}»
          </p>

          {/* morning / evening toggle */}
          <div className="relative mt-5 grid grid-cols-2 rounded-full p-1 glass">
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
                    <Field
                      key={i}
                      index={i + 1}
                      value={v}
                      placeholder={i === 0 ? 'например, за утренний кофе' : '…'}
                      onChange={(val) => saveMorning({ ...morning, gratitude: setList(morning.gratitude, i, val) })}
                    />
                  ))}
                </Section>
                <Section title="Что сделает день прекрасным" hint="3 пункта">
                  {morning.great.map((v, i) => (
                    <Field
                      key={i}
                      index={i + 1}
                      value={v}
                      placeholder={i === 0 ? 'один маленький шаг' : '…'}
                      onChange={(val) => saveMorning({ ...morning, great: setList(morning.great, i, val) })}
                    />
                  ))}
                </Section>
                <Section title="Я…" hint="самоутверждение">
                  <Field
                    value={morning.affirmation}
                    placeholder="Я спокоен и справлюсь с тем, что важно"
                    onChange={(val) => saveMorning({ ...morning, affirmation: val })}
                  />
                </Section>
              </>
            ) : (
              <>
                <Section title="Доброе дело дня" hint="что хорошего я сделал">
                  <Field
                    value={evening.goodDeed}
                    placeholder="помог, поддержал, поблагодарил…"
                    onChange={(val) => saveEvening({ ...evening, goodDeed: val })}
                  />
                </Section>
                <Section title="Что прекрасного случилось сегодня" hint="3 пункта">
                  {evening.amazing.map((v, i) => (
                    <Field
                      key={i}
                      index={i + 1}
                      value={v}
                      placeholder={i === 0 ? 'маленький приятный момент' : '…'}
                      onChange={(val) => saveEvening({ ...evening, amazing: setList(evening.amazing, i, val) })}
                    />
                  ))}
                </Section>
                <Section title="Как сделать день ещё лучше" hint="мягко, без критики">
                  <Field
                    value={evening.better}
                    placeholder="что я попробую завтра"
                    onChange={(val) => saveEvening({ ...evening, better: val })}
                  />
                </Section>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-[11px] text-foam/35">Сохраняется автоматически</p>
        </div>
      ) : (
        <DiaryHistory diary={diary} />
      )}
    </div>
  )
}

// ---- read-only history ---------------------------------------------------

function hasContent(arr?: string[], ...extra: (string | undefined)[]): boolean {
  const all = [...(arr ?? []), ...extra]
  return all.some((s) => s && s.trim().length > 0)
}

function fmtDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function Lines({ items }: { items: (string | undefined)[] }) {
  const filled = items.filter((s): s is string => !!s && s.trim().length > 0)
  if (!filled.length) return null
  return (
    <ul className="mt-1 flex flex-col gap-0.5">
      {filled.map((s, i) => (
        <li key={i} className="text-[13.5px] leading-snug text-foam/75">
          {s}
        </li>
      ))}
    </ul>
  )
}

function DiaryHistory({ diary }: { diary: Record<string, DiaryEntry> }) {
  const entries = Object.values(diary)
    .filter((e) => hasContent(e.morning?.gratitude, e.morning?.affirmation) || hasContent(e.morning?.great) || hasContent(e.evening?.amazing, e.evening?.goodDeed, e.evening?.better))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="mt-2 animate-fadeUp">
      <h1 className="px-1 font-serif text-[30px] leading-tight tracking-tight text-foam">История</h1>
      {entries.length === 0 ? (
        <p className="mt-3 px-1 text-[13.5px] leading-relaxed text-foam/50">
          Здесь будут твои записи. Начни с пары строк утром или вечером — этого достаточно.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {entries.map((e) => (
            <div key={e.date} className="rounded-[1.75rem] p-1.5 glass">
              <div className="rounded-[1.375rem] px-5 py-4">
                <p className="font-serif text-[16px] capitalize tracking-tight text-foam">{fmtDate(e.date)}</p>
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
