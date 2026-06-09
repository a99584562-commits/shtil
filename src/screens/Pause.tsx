import { useEffect, useRef, useState } from 'react'
import type { Practice } from '../types'
import { Orb } from '../components/Orb'
import { TopBar } from '../components/TopBar'
import { audio } from '../lib/audio'
import { logSession } from '../lib/store'
import { useIdleBreath } from '../lib/useIdleBreath'

type Stage = 'ready' | 'breath' | 'reflect' | 'done'

const PHASES = [
  { label: 'Вдох', seconds: 4, scaleTo: 1 },
  { label: 'Задержка', seconds: 3, scaleTo: 1 },
  { label: 'Выдох', seconds: 6, scaleTo: 0 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.seconds, 0)
const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2

const REFLECTIONS = ['По привычке', 'Скучно', 'Тревожно', 'Что-то проверить', 'Правда нужно']

export function Pause({ practice, onDone }: { practice: Practice; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('ready')
  const [view, setView] = useState({ scale: 0, label: 'Вдох' })
  const [doneMsg, setDoneMsg] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const raf = useRef(0)
  const started = useRef(0)
  const idle = useIdleBreath(stage === 'ready' || stage === 'done')

  function toggle(r: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      next.has(r) ? next.delete(r) : next.add(r)
      return next
    })
  }

  useEffect(() => {
    if (stage !== 'breath') return
    let alive = true
    const start = performance.now()
    const tick = () => {
      if (!alive) return
      const t = (performance.now() - start) / 1000
      if (t >= TOTAL) {
        setView({ scale: 0, label: 'Выдох' })
        setStage('reflect')
        return
      }
      let acc = 0
      let pi = 0
      for (let i = 0; i < PHASES.length; i++) {
        if (t < acc + PHASES[i].seconds) {
          pi = i
          break
        }
        acc += PHASES[i].seconds
      }
      const ph = PHASES[pi]
      const from = pi === 0 ? 0 : PHASES[pi - 1].scaleTo
      const prog = Math.min((t - acc) / ph.seconds, 1)
      setView({ scale: from + (ph.scaleTo - from) * easeInOutSine(prog), label: ph.label })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf.current)
    }
  }, [stage])

  async function begin() {
    await audio.ensure()
    audio.cue('rise')
    started.current = performance.now()
    setStage('breath')
  }

  function choose(putAway: boolean) {
    const seconds = Math.round((performance.now() - started.current) / 1000)
    logSession({ practiceId: practice.id, kind: practice.kind, seconds: Math.max(seconds, 12) })
    audio.bell(396, 0.4)
    setDoneMsg(
      putAway
        ? 'Хороший выбор. Телефон подождёт — займись тем, что важнее.'
        : 'Окей. Теперь хотя бы это решение — твоё, а не привычки.',
    )
    setStage('done')
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <TopBar onBack={onDone} title={practice.title} />
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {stage === 'ready' && (
          <div className="flex flex-col items-center text-center animate-fadeUp">
            <Orb scale={idle} accent={practice.accent}>
              <span className="font-serif text-3xl text-foam/90">Стоп</span>
            </Orb>
            <h2 className="mt-8 font-serif text-3xl tracking-tight text-foam">Один вдох</h2>
            <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-foam/60">
              Прежде чем нырнуть в телефон — короткая пауза. Всего один спокойный вдох.
            </p>
            <button
              onClick={begin}
              className="mt-8 rounded-full px-8 py-3.5 font-medium text-sea-900 transition-all duration-500 ease-fluid active:scale-[0.97]"
              style={{ background: 'linear-gradient(180deg,#eafcfb,#9fe6e1)' }}
            >
              Сделать вдох
            </button>
          </div>
        )}

        {stage === 'breath' && (
          <div className="flex flex-col items-center">
            <Orb scale={view.scale} accent={practice.accent}>
              <span className="font-serif text-3xl text-foam">{view.label}</span>
            </Orb>
            <p className="mt-8 max-w-xs text-center text-[14px] leading-relaxed text-foam/55">
              Дыши вместе с кругом.
            </p>
          </div>
        )}

        {stage === 'reflect' && (
          <div className="flex w-full max-w-xs flex-col items-center text-center animate-fadeUp">
            <h2 className="font-serif text-[28px] leading-tight tracking-tight text-foam">
              Зачем мне сейчас телефон?
            </h2>
            <p className="mt-3 text-[13.5px] leading-snug text-foam/55">
              Отметь, что чувствуешь — честно, без осуждения.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {REFLECTIONS.map((r) => {
                const on = picked.has(r)
                return (
                  <button
                    key={r}
                    onClick={() => toggle(r)}
                    className={`rounded-full px-3.5 py-2 text-[12.5px] transition-all duration-300 ease-fluid active:scale-95 ${
                      on ? 'glass-strong text-foam' : 'glass text-foam/65'
                    }`}
                    style={on ? { boxShadow: 'inset 0 0 0 1px rgba(95,214,208,0.55)' } : undefined}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
            <div className="mt-9 flex w-full flex-col gap-3">
              <button
                onClick={() => choose(true)}
                className="rounded-full px-6 py-3.5 font-medium text-sea-900 transition-all duration-500 ease-fluid active:scale-[0.97]"
                style={{ background: 'linear-gradient(180deg,#eafcfb,#9fe6e1)' }}
              >
                Отложу телефон
              </button>
              <button
                onClick={() => choose(false)}
                className="rounded-full px-6 py-3.5 text-sm text-foam/80 transition-all duration-500 ease-fluid active:scale-95 glass"
              >
                Продолжу — но осознанно
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="flex flex-col items-center text-center animate-fadeUp">
            <Orb scale={idle} accent={practice.accent}>
              <span className="font-serif text-2xl text-foam/90">·</span>
            </Orb>
            <h2 className="mt-8 max-w-xs font-serif text-2xl leading-snug tracking-tight text-foam">{doneMsg}</h2>
            <button
              onClick={onDone}
              className="mt-8 rounded-full px-7 py-3 text-sm font-medium text-sea-900 transition-all duration-500 ease-fluid active:scale-95"
              style={{ background: 'linear-gradient(180deg,#eafcfb,#9fe6e1)' }}
            >
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
