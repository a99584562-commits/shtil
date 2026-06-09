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

const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2

export function BreathingSession({
  practice,
  onDone,
}: {
  practice: Practice
  onDone: () => void
}) {
  const settings = useSettings()
  const pattern = practice.pattern ?? []
  const totalCycles = practice.cycles ?? 6
  const cycleDur = pattern.reduce((s, p) => s + p.seconds, 0)
  const totalDur = cycleDur * totalCycles

  const [stage, setStage] = useState<Stage>('ready')
  const [view, setView] = useState({ scale: 0, label: 'Готовься', phaseLeft: 0, cycle: 1, progress: 0, pulse: 0 })
  const idle = useIdleBreath(stage === 'ready' || stage === 'done')

  const raf = useRef(0)
  const baseStart = useRef(0)
  const elapsedBefore = useRef(0)
  const lastPhase = useRef(-1)
  const pulseRef = useRef(0)
  const actualSeconds = useRef(0)

  // Drive the breath timeline while running.
  useEffect(() => {
    if (stage !== 'running') return
    let alive = true

    const tick = () => {
      if (!alive) return
      const t = elapsedBefore.current + (performance.now() - baseStart.current) / 1000
      if (t >= totalDur) {
        finish(totalDur)
        return
      }
      const cycleIdx = Math.floor(t / cycleDur)
      const within = t - cycleIdx * cycleDur

      let acc = 0
      let pi = 0
      for (let i = 0; i < pattern.length; i++) {
        if (within < acc + pattern[i].seconds) {
          pi = i
          break
        }
        acc += pattern[i].seconds
      }
      const phase = pattern[pi]
      const phaseElapsed = within - acc
      const prog = Math.min(Math.max(phaseElapsed / phase.seconds, 0), 1)
      const from = pattern[(pi - 1 + pattern.length) % pattern.length].scaleTo
      const scale = from + (phase.scaleTo - from) * easeInOutSine(prog)

      // cue + exhale ripple on each new phase
      const phaseKey = cycleIdx * pattern.length + pi
      if (phaseKey !== lastPhase.current) {
        lastPhase.current = phaseKey
        const dir = phase.scaleTo > from ? 'rise' : phase.scaleTo < from ? 'fall' : 'hold'
        if (settings.cueTones) audio.cue(dir)
        if (dir === 'fall') pulseRef.current += 1 // exhale → drop a ripple
      }

      setView({
        scale,
        label: phase.label,
        phaseLeft: Math.ceil(phase.seconds - phaseElapsed),
        cycle: Math.min(cycleIdx + 1, totalCycles),
        progress: t / totalDur,
        pulse: pulseRef.current,
      })
      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Cleanup on unmount.
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
    lastPhase.current = -1
    pulseRef.current = 0
    baseStart.current = performance.now()
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
    actualSeconds.current = Math.round(seconds)
    audio.bell(396, 0.5)
    audio.stopAmbient()
    logSession({ practiceId: practice.id, kind: practice.kind, seconds: actualSeconds.current })
    setView((v) => ({ ...v, scale: 0, label: 'Готово' }))
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

  const patternSummary = pattern.map((p) => `${p.label.toLowerCase()} ${p.seconds}`).join(' · ')

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <TopBar onBack={stopEarly} title={practice.title} />

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {stage === 'ready' && (
          <div className="flex flex-col items-center text-center animate-fadeUp">
            <Orb scale={idle} accent={practice.accent}>
              <span className="font-serif text-2xl text-foam/90">Дыши</span>
            </Orb>
            <h2 className="mt-8 font-serif text-3xl tracking-tight text-foam">{practice.title}</h2>
            <p className="mt-2 max-w-xs text-[13.5px] capitalize leading-snug text-foam/55">
              {patternSummary}
            </p>
            <p className="mt-1 text-[12px] text-foam/45">{totalCycles} циклов · ~{practice.minutes} мин</p>
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
          <div className="flex flex-col items-center">
            <div className="relative grid place-items-center">
              <ProgressRing progress={view.progress} accent={practice.accent} />
              <Orb
                scale={view.scale}
                accent={practice.accent}
                pulse={view.pulse}
                audioReactive={settings.ambient}
              >
                <div className="flex flex-col items-center">
                  <span className="font-serif text-3xl leading-none text-foam">{view.label}</span>
                  <span className="mt-2 text-sm tabular-nums text-foam/55">{view.phaseLeft}</span>
                </div>
              </Orb>
            </div>
            <p className="mt-8 text-[12px] tabular-nums tracking-widest2 text-foam/45">
              ЦИКЛ {view.cycle} / {totalCycles}
            </p>
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
            <h2 className="mt-8 font-serif text-3xl tracking-tight text-foam">Хорошо подышали</h2>
            <p className="mt-2 max-w-xs text-[13.5px] leading-snug text-foam/55">
              {totalCycles} циклов спокойного дыхания. Заметь, как изменилось состояние.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => {
                  setView({ scale: 0, label: 'Готовься', phaseLeft: 0, cycle: 1, progress: 0, pulse: 0 })
                  setStage('ready')
                }}
                className="rounded-full px-6 py-3 text-sm text-foam/85 transition-all duration-500 ease-fluid active:scale-95 glass"
              >
                Ещё раз
              </button>
              <button
                onClick={onDone}
                className="rounded-full px-7 py-3 text-sm font-medium text-sea-900 transition-all duration-500 ease-fluid active:scale-95"
                style={{ background: 'linear-gradient(180deg,#eafcfb,#9fe6e1)' }}
              >
                Готово
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
