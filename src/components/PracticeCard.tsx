import type { Practice } from '../types'
import { WaveIcon, CircleIcon, HandIcon, SproutIcon } from './Icons'

const ACCENT_GLOW: Record<Practice['accent'], string> = {
  cyan: 'rgba(95,214,208,0.22)',
  sky: 'rgba(143,199,224,0.22)',
  dawn: 'rgba(244,184,143,0.20)',
}
const ACCENT_DOT: Record<Practice['accent'], string> = {
  cyan: '#5fd6d0',
  sky: '#8fc7e0',
  dawn: '#f4b88f',
}

function KindIcon({ practice, className }: { practice: Practice; className?: string }) {
  switch (practice.kind) {
    case 'breathing':
      return <CircleIcon className={className} />
    case 'timer':
      return <SproutIcon className={className} />
    case 'grounding':
      return <WaveIcon className={className} />
    case 'pause':
      return <HandIcon className={className} />
  }
}

export function PracticeCard({
  practice,
  onStart,
  prominent = false,
}: {
  practice: Practice
  onStart: (p: Practice) => void
  prominent?: boolean
}) {
  const glow = ACCENT_GLOW[practice.accent]
  const dot = ACCENT_DOT[practice.accent]

  // Double-bezel: outer tray + inner glass plate.
  return (
    <button
      onClick={() => onStart(practice)}
      className="group block w-full text-left transition-transform duration-500 ease-fluid active:scale-[0.985]"
    >
      <div className="rounded-[2rem] p-1.5 glass">
        <div
          className="relative overflow-hidden rounded-[1.625rem] px-5 transition-all duration-700 ease-fluid"
          style={{
            paddingTop: prominent ? '1.5rem' : '1.15rem',
            paddingBottom: prominent ? '1.5rem' : '1.15rem',
            background: `radial-gradient(120% 100% at 0% 0%, ${glow} 0%, transparent 60%)`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-foam/90 transition-transform duration-700 ease-fluid group-hover:scale-105"
              style={{ background: 'rgba(207,238,240,0.08)', border: '1px solid rgba(207,238,240,0.12)' }}
            >
              <KindIcon practice={practice} />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className={
                  prominent
                    ? 'font-serif text-2xl leading-tight text-foam'
                    : 'font-serif text-xl leading-tight text-foam'
                }
              >
                {practice.title}
              </h3>
              <p className="mt-1 text-[13.5px] leading-snug text-foam/65">{practice.tagline}</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-foam/50">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: dot }}
                />
                <span>~{practice.minutes} мин</span>
              </div>
            </div>
          </div>
          {prominent && (
            <p className="mt-4 border-t border-foam/10 pt-3 text-[12.5px] leading-relaxed text-foam/55">
              {practice.science}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
