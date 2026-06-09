import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { audio } from '../lib/audio'

const ACCENTS = {
  cyan: { core: '#5fd6d0', halo: 'rgba(95,214,208,0.55)', ring: 'rgba(95,214,208,0.35)' },
  sky: { core: '#8fc7e0', halo: 'rgba(143,199,224,0.55)', ring: 'rgba(143,199,224,0.35)' },
  dawn: { core: '#f4b88f', halo: 'rgba(244,184,143,0.5)', ring: 'rgba(244,184,143,0.32)' },
}

/**
 * The breathing orb. `scale` (0..1) is driven by the parent each frame.
 * `pulse` — increment it to release a ripple ring (e.g. on each exhale).
 * `audioReactive` — glow shimmers with the ambient loudness.
 */
export function Orb({
  scale,
  accent = 'cyan',
  pulse = 0,
  audioReactive = false,
  children,
}: {
  scale: number
  accent?: keyof typeof ACCENTS
  pulse?: number
  audioReactive?: boolean
  children?: ReactNode
}) {
  const a = ACCENTS[accent]
  const s = 0.58 + Math.min(Math.max(scale, 0), 1) * 0.48

  // Exhale ripples
  const [ripples, setRipples] = useState<number[]>([])
  const rid = useRef(0)
  useEffect(() => {
    if (!pulse) return
    const id = rid.current++
    setRipples((prev) => [...prev.slice(-3), id])
    const t = window.setTimeout(() => setRipples((prev) => prev.filter((p) => p !== id)), 2500)
    return () => clearTimeout(t)
  }, [pulse])

  // Audio-reactive glow — write straight to the DOM each frame (no re-render).
  const glowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!audioReactive) return
    let raf = 0
    let smooth = 0
    const tick = () => {
      smooth += (audio.level() - smooth) * 0.18
      if (glowRef.current) {
        glowRef.current.style.opacity = (0.12 + smooth * 0.6).toFixed(3)
        glowRef.current.style.transform = `scale(${(s * (1 + smooth * 0.18)).toFixed(3)})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [audioReactive, s])

  return (
    <div className="relative grid place-items-center" style={{ width: 280, height: 280 }}>
      {/* exhale ripples */}
      {ripples.map((id) => (
        <span
          key={id}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 210,
            height: 210,
            border: `1px solid ${a.ring}`,
            animation: 'orbRipple 2.4s cubic-bezier(0.22,0.61,0.36,1) forwards',
          }}
        />
      ))}

      {/* audio-reactive glow */}
      {audioReactive && (
        <div
          ref={glowRef}
          className="pointer-events-none absolute rounded-full blur-2xl"
          style={{
            width: 240,
            height: 240,
            background: `radial-gradient(circle, ${a.halo} 0%, transparent 60%)`,
            opacity: 0.12,
          }}
        />
      )}

      {/* soft outer halo */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: 280,
          height: 280,
          background: `radial-gradient(circle, ${a.halo} 0%, transparent 60%)`,
          transform: `scale(${s * 1.05})`,
          opacity: 0.55 + scale * 0.35,
        }}
      />
      {/* outer hairline ring */}
      <div
        className="absolute rounded-full"
        style={{ width: 240, height: 240, border: `1px solid ${a.ring}`, transform: `scale(${s})` }}
      />
      {/* glass body */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          transform: `scale(${s})`,
          background: `radial-gradient(circle at 50% 38%, ${a.core}aa 0%, ${a.core}33 42%, transparent 72%)`,
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.25), 0 30px 80px -40px ${a.halo}`,
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      />
      {/* luminous core */}
      <div
        className="absolute rounded-full"
        style={{
          width: 96,
          height: 96,
          transform: `scale(${s})`,
          background: `radial-gradient(circle at 50% 40%, #ffffff 0%, ${a.core} 45%, transparent 75%)`,
          opacity: 0.32 + scale * 0.4,
          filter: 'blur(2px)',
        }}
      />
      {/* unscaled centre overlay */}
      <div className="relative z-10 grid place-items-center text-center">{children}</div>
    </div>
  )
}
