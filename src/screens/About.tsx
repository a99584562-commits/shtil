import { TopBar } from '../components/TopBar'
import { PRACTICES } from '../data/practices'
import { updateSettings, useSettings } from '../lib/store'
import type { Settings } from '../types'

function Toggle({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
  hint: string
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left glass transition-all duration-300 ease-fluid active:scale-[0.99]"
    >
      <div className="min-w-0 pr-4">
        <p className="text-[14px] text-foam/90">{label}</p>
        <p className="text-[11.5px] leading-snug text-foam/45">{hint}</p>
      </div>
      <span
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ease-fluid"
        style={{ background: on ? 'rgba(95,214,208,0.8)' : 'rgba(207,238,240,0.12)' }}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white transition-transform duration-300 ease-fluid"
          style={{ left: 4, transform: on ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </span>
    </button>
  )
}

export function About({ onBack }: { onBack: () => void }) {
  const settings = useSettings()
  const set = (patch: Partial<Settings>) => updateSettings(patch)

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] px-5 pb-16">
      <TopBar onBack={onBack} title="О практиках" />

      <div className="mt-4 animate-fadeUp">
        <h1 className="px-1 font-serif text-[30px] leading-tight text-foam">Почему это работает</h1>
        <p className="mt-3 px-1 text-[13.5px] leading-relaxed text-foam/60">
          Здесь нет магии — только простые техники с исследовательской базой. Они не лечат, но
          помогают вернуть внимание из телефона в тело и в текущий момент.
        </p>

        {/* settings */}
        <h2 className="mt-8 px-1 font-serif text-lg text-foam/90">Настройки</h2>
        <div className="mt-3 flex flex-col gap-2">
          <Toggle
            on={settings.ambient}
            onChange={(v) => set({ ambient: v })}
            label="Фоновый эмбиент"
            hint="Тёплый океанический гул во время практик"
          />
          <Toggle
            on={settings.cueTones}
            onChange={(v) => set({ cueTones: v })}
            label="Подсказки дыхания"
            hint="Мягкий тон на смене вдоха и выдоха"
          />
          <Toggle
            on={settings.intervalBell}
            onChange={(v) => set({ intervalBell: v })}
            label="Колокольчик каждую минуту"
            hint="Тихий звон-якорь в медитациях по таймеру"
          />
          <Toggle
            on={settings.reduceMotion}
            onChange={(v) => set({ reduceMotion: v })}
            label="Меньше движения"
            hint="Спокойнее анимации, если так комфортнее"
          />
        </div>

        {/* science per practice */}
        <h2 className="mt-8 px-1 font-serif text-lg text-foam/90">Практики</h2>
        <div className="mt-3 flex flex-col gap-3">
          {PRACTICES.map((p) => (
            <div key={p.id} className="rounded-[1.75rem] p-1.5 glass">
              <div className="rounded-[1.375rem] px-5 py-4">
                <h3 className="font-serif text-[17px] text-foam">{p.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-foam/55">{p.science}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 px-1 text-[11px] leading-relaxed text-foam/35">
          Если тревога или бессонница становятся постоянными — это повод обратиться к специалисту, а
          не только к дыхательным практикам.
        </p>
      </div>
    </div>
  )
}
