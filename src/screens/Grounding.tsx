import { useRef, useState } from 'react'
import type { Practice } from '../types'
import { Orb } from '../components/Orb'
import { TopBar } from '../components/TopBar'
import { audio } from '../lib/audio'
import { logSession, useSettings } from '../lib/store'

type Stage = 'ready' | 'running' | 'done'

const STEPS = [
  { n: 5, sense: 'увидеть', prompt: 'Найди 5 вещей, которые видишь прямо сейчас' },
  { n: 4, sense: 'услышать', prompt: 'Прислушайся к 4 звукам вокруг' },
  { n: 3, sense: 'ощутить', prompt: '3 ощущения тела или прикосновения' },
  { n: 2, sense: 'учуять', prompt: '2 запаха рядом' },
  { n: 1, sense: 'распробовать', prompt: '1 вкус во рту' },
]

export function Grounding({ practice, onDone }: { practice: Practice; onDone: () => void }) {
  const settings = useSettings()
  const [stage, setStage] = useState<Stage>('ready')
  const [stepIdx, setStepIdx] = useState(0)
  const [marked, setMarked] = useState(0)
  const started = useRef(0)

  const step = STEPS[stepIdx]

  async function begin() {
    await audio.ensure()
    audio.bell(528, 0.4)
    started.current = performance.now()
    setStage('running')
  }

  function mark() {
    if (settings.cueTones) audio.cue('hold')
    const next = marked + 1
    if (next >= step.n) {
      if (stepIdx >= STEPS.length - 1) {
        finish()
      } else {
        setMarked(0)
        setStepIdx((i) => i + 1)
      }
    } else {
      setMarked(next)
    }
  }

  function finish() {
    audio.bell(396, 0.5)
    const seconds = Math.round((performance.now() - started.current) / 1000)
    logSession({ practiceId: practice.id, kind: practice.kind, seconds: Math.max(seconds, 20) })
    setStage('done')
  }

  function stopEarly() {
    if (stage === 'running') {
      const seconds = Math.round((performance.now() - started.current) / 1000)
      if (seconds >= 5) {
        logSession({ practiceId: practice.id, kind: practice.kind, seconds })
      }
    }
    onDone()
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <TopBar onBack={stopEarly} title={practice.title} />
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {stage === 'ready' && (
          <div className="flex flex-col items-center text-center animate-fadeUp">
            <Orb scale={0.5} accent={practice.accent}>
              <span className="font-serif text-3xl text-foam/90">5·4·3·2·1</span>
            </Orb>
            <h2 className="mt-8 font-serif text-3xl text-foam">{practice.title}</h2>
            <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-foam/60">
              Спокойно, без спешки. Замечай по одному и отмечай касанием.
            </p>
            <button
              onClick={begin}
              className="mt-8 rounded-full px-8 py-3.5 font-medium text-sea-900 transition-all duration-500 ease-fluid active:scale-[0.97]"
              style={{ background: 'linear-gradient(180deg,#eafcfb,#9fe6e1)' }}
            >
              Начать
            </button>
          </div>
        )}

        {stage === 'running' && (
          <button
            onClick={mark}
            className="flex w-full flex-1 select-none flex-col items-center justify-center"
          >
            <Orb scale={0.4 + (marked / step.n) * 0.5} accent={practice.accent}>
              <div className="flex flex-col items-center">
                <span className="font-serif text-6xl leading-none text-foam">{step.n - marked}</span>
                <span className="mt-2 text-sm text-foam/55">{step.sense}</span>
              </div>
            </Orb>
            <p className="mt-9 max-w-xs text-center text-[15px] leading-relaxed text-foam/70">
              {step.prompt}
            </p>
            {/* progress dots across the five senses */}
            <div className="mt-7 flex items-center gap-2">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-500 ease-fluid"
                  style={{
                    width: i === stepIdx ? 22 : 6,
                    background:
                      i < stepIdx
                        ? 'rgba(95,214,208,0.8)'
                        : i === stepIdx
                          ? 'rgba(207,238,240,0.85)'
                          : 'rgba(207,238,240,0.25)',
                  }}
                />
              ))}
            </div>
            <span className="mt-7 text-[12px] text-foam/40">коснись, когда заметил</span>
          </button>
        )}

        {stage === 'done' && (
          <div className="flex flex-col items-center text-center animate-fadeUp">
            <Orb scale={0.32} accent={practice.accent}>
              <span className="font-serif text-2xl text-foam/90">Здесь</span>
            </Orb>
            <h2 className="mt-8 font-serif text-3xl text-foam">Ты вернулся в момент</h2>
            <p className="mt-2 max-w-xs text-[13.5px] leading-snug text-foam/55">
              Внимание снова в теле и в комнате, а не в ленте.
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
