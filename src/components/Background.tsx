import { PALETTES } from '../lib/time'
import type { TimeOfDay } from '../types'

/**
 * Living "water & sky" backdrop: time-of-day hues, drifting glows with parallax,
 * a vignette and faint grain. Never intercepts touches.
 */
export function Background({ time }: { time: TimeOfDay }) {
  const p = PALETTES[time]
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-colors duration-[2500ms] ease-fluid"
      style={{ backgroundColor: p.base }}
    >
      {/* deep vertical sea gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${p.horizon} 0%, transparent 38%, rgba(0,0,0,0.18) 100%)`,
        }}
      />

      {/* drifting glow A (parallax) */}
      <div
        className="absolute inset-0"
        style={{ transform: 'translate3d(calc(var(--px) * 1.3), calc(var(--py) * 1.3), 0)' }}
      >
        <div
          className="absolute -left-[20%] top-[-10%] h-[70vh] w-[70vh] rounded-full blur-3xl animate-driftSlow"
          style={{ background: `radial-gradient(circle, ${p.glowA} 0%, transparent 65%)` }}
        />
      </div>

      {/* drifting glow B (parallax, opposite) */}
      <div
        className="absolute inset-0"
        style={{ transform: 'translate3d(calc(var(--px) * -1), calc(var(--py) * -1), 0)' }}
      >
        <div
          className="absolute right-[-25%] top-[25%] h-[80vh] w-[80vh] rounded-full blur-3xl animate-driftSlow"
          style={{ background: `radial-gradient(circle, ${p.glowB} 0%, transparent 65%)`, animationDelay: '-9s' }}
        />
      </div>

      {/* gentle vignette — attention settles to the centre */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(125% 100% at 50% 42%, transparent 52%, rgba(0,0,0,0.30) 100%)',
        }}
      />

      {/* subtle film grain for a physical, non-digital feel */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
