import { useEffect, useRef, useState } from 'react'
import type { Practice } from '../types'
import { Orb } from '../components/Orb'
import { ProgressRing } from '../components/ProgressRing'
import { TopBar } from '../components/TopBar'
import { audio } from '../lib/audio'
import { logSession, useSettings } from '../lib/store'
import { useIdleBreath } from '../lib/useIdleBreath'
import { requestTilt } from '../lib/parallax'

type Stage = 'ready' | 'running' | 'paused' | 'done'

const DURATIONS = [3, 5, 10, 15, 20]
const BREATH_PERIOD = 11 // seconds for a calm full breath (~5.5 in / 5.5 out)

function mmss(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TimerSession({ practice, onDone }: { practice: Practice; onDone: () => void }) {
  const settings = useSettings()
  const [minutes, setMinutes] = useState(practice.minutes)
  const [stage, setStage] = useState<Stage>('ready')
  const [view, setView] = useState({ scale: 0.5, remaining: practice.minutes * 60, guideIdx: 0, progress: 0, pulse: 0 })
  const idle = useIdleBreath(stage === 'ready' || stage === 'done')

  const raf = useRef(0)
  const baseStart = useRef(0)
  const elapsedBefore = useRef(0)
  const lastBellMin = useRef(0)
  const lastMarker = useRef(0)
  const pulseRef = useRef(0)
  const guide = practice.guide ?? []

  useEffect(() => {
    if (stage !== 'running') return
    let alive = true
    const total = minutes * 60

    const tick = () => {
      if (!alive) return
      const t = elapsedBefore.current + (performance.now() - baseStart.current) / 1000
      if (t >= total) {
        finish(total)
        return
      }
      const remaining = total - t
      // gentle auto-breath for the orb
      const phase = (t % BREATH_PERIOD) / BREATH_PERIOD
      const scale = (1 + Math.sin(phase * Math.PI * 2 - Math.PI / 2)) / 2
      // slowly advance the guidance text across the whole session
      const guideIdx = guide.length ? Math.min(Math.floor((t / total) * guide.length), guide.length - 1) : 0

      // interval bell on each whole minute
      const minMark = Math.floor(t / 60)
      if (settings.intervalBell && minMark > 0 && minMark !== lastBellMin.current) {
        lastBellMin.current = minMark
        audio.bell(432, 0.32)
      }

      // release a ripple at the start of each exhale (second half of the breath)
      const marker = Math.floor((t / BREATH_PERIOD) * 2)
      if (marker !== lastMarker.current) {
        lastMarker.current = marker
        if (marker % 2 === 1) pulseRef.current += 1
      }

      setView({ scale, remaining, guideIdx, progress: t / total, pulse: pulseRef.current })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(raf.current)
      audio.stopAmbient()
    }
  }, [])

  async function begin() {
    requestTilt()
    await audio.ensure()
    audio.bell(528, 0.45)
    if (settings.ambient) audio.startAmbient()
    elapsedBefore.current = 0
    lastBellMin.current = 0
    lastMarker.current = 0
    pulseRef.current = 0
    baseStart.current = performance.now()
    setView({ scale: 0.5, remaining: minutes * 60, guideIdx: 0, progress: 0, pulse: 0 })
    setStage('running')
  }

  function pause() {
    elapsedBefore.current += (performance.now() - baseStart.current) / 1000
    setStage('paused')
  }
  function resume() {
    baseStart.current = performance.now()
    setStage('running')
  }

  function finish(seconds: number) {
    cancelAnimationFrame(raf.current)
    audio.bell(396, 0.5)
    audio.stopAmbient()
    logSession({ practiceId: practice.id, kind: practice.kind, seconds: Math.round(seconds) })
    setView((v) => ({ ...v, scale: 0.3, remaining: 0 }))
    setStage('done')
  }

  function stopEarly() {
    const elapsed =
      stage === 'running'
        ? elapsedBefore.current + (performance.now() - baseStart.current) / 1000
        : elapsedBefore.current
    cancelAnimationFrame(raf.current)
    audio.stopAmbient()
    if (elapsed >= 5) {
      logSession({ practiceId: practice.id, kind: practice.kind, seconds: Math.round(elapsed) })
    }
    onDone()
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <TopBar onBack={stopEarly} title={practice.title} />

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {stage === 'ready' && (
          <div className="flex w-full max-w-xs flex-col items-center text-center animate-fadeUp">
            <Orb scale={idle} accent={practice.accent}>
              <span className="font-serif text-2xl text-foam/90">{minutes}<span className="text-base text-foam/50"> мин</span></span>
            </Orb>
            <h2 className="mt-8 font-serif text-3xl tracking-tight text-foam">{practice.title}</h2>
            <p className="mt-2 text-[13.5px] leading-snug text-foam/55">{practice.tagline}</p>

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setMinutes(d)}
                  className={`rounded-full px-4 py-2 text-sm transition-all duration-300 ease-fluid active:scale-95 ${
                    minutes === d ? 'glass-strong text-foam' : 'glass text-foam/60'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              onClick={begin}
              className="mt-8 rounded-full px-8 py-3.5 font-medium text-sea-900 transition-all duration-500 ease-fluid active:scale-[0.97]"
              style={{ background: 'linear-gradient(180deg,#eafcfb,#9fe6e1)' }}
            >
              Начать
            </button>
          </div>
        )}

        {(stage === 'running' || stage === 'paused') && (
          <div className="flex w-full max-w-sm flex-col items-center">
            <div className="relative grid place-items-center">
              <ProgressRing progress={view.progress} accent={practice.accent} />
              <Orb
                scale={view.scale}
                accent={practice.accent}
                pulse={view.pulse}
                audioReactive={settings.ambient}
              >
                <span className="font-serif text-4xl tabular-nums text-foam">{mmss(view.remaining)}</span>
              </Orb>
            </div>
            {guide.length > 0 && (
              <p
                key={view.guideIdx}
                className="mt-9 min-h-[3.5rem] max-w-xs text-center text-[15px] leading-relaxed text-foam/70 animate-fadeUp"
              >
                {guide[view.guideIdx]}
              </p>
            )}
            <div className="mt-6 flex items-center gap-3">
              {stage === 'running' ? (
                <button
                  onClick={pause}
                  className="rounded-full px-6 py-3 text-sm text-foam/85 transition-all duration-500 ease-fluid active:scale-95 glass"
                >
                  Пауза
                </button>
              ) : (
                <button
                  onClick={resume}
                  className="rounded-full px-6 py-3 text-sm text-foam/85 transition-all duration-500 ease-fluid active:scale-95 glass-strong"
                >
                  Продолжить
                </button>
              )}
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="flex flex-col items-center text-center animate-fadeUp">
            <Orb scale={idle} accent={practice.accent}>
              <span className="font-serif text-2xl text-foam/90">Готово</span>
            </Orb>
            <h2 className="mt-8 font-serif text-3xl tracking-tight text-foam">{minutes} минут тишины</h2>
            <p className="mt-2 max-w-xs text-[13.5px] leading-snug text-foam/55">
              Побудь ещё пару секунд в этом состоянии, прежде чем вернуться.
            </p>
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
