const ACCENT: Record<string, string> = {
  cyan: '#5fd6d0',
  sky: '#8fc7e0',
  dawn: '#f4b88f',
}

/**
 * Thin circular progress framing the orb during a session. Stays a fixed size
 * (the orb breathes inside it) so it reads as a steady frame, not a pulse.
 */
export function ProgressRing({
  progress,
  accent = 'cyan',
  size = 296,
}: {
  progress: number
  accent?: string
  size?: number
}) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const color = ACCENT[accent] ?? ACCENT.cyan
  const p = Math.min(Math.max(progress, 0), 1)

  return (
    <svg
      width={size}
      height={size}
      className="pointer-events-none absolute -rotate-90"
      style={{ overflow: 'visible' }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(207,238,240,0.08)" strokeWidth={2} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p)}
        style={{ transition: 'stroke-dashoffset 0.3s linear', opacity: 0.7 }}
      />
    </svg>
  )
}
