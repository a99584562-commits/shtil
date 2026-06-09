import { useEffect, useState } from 'react'

interface Ripple {
  id: number
  x: number
  y: number
}

/**
 * Global water ripple from every tap — a soft ring expands from the touch point
 * and fades. Rendered in a fixed, non-interactive overlay above everything.
 */
export function TapRipples() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  useEffect(() => {
    let id = 0
    let last = 0
    const onDown = (e: PointerEvent) => {
      if (document.documentElement.classList.contains('reduce-motion')) return
      const now = performance.now()
      if (now - last < 90) return // avoid floods on rapid input
      last = now
      const r = { id: id++, x: e.clientX, y: e.clientY }
      setRipples((prev) => [...prev.slice(-6), r])
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((p) => p.id !== r.id))
      }, 720)
    }
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute h-5 w-5 rounded-full"
          style={{
            left: r.x,
            top: r.y,
            border: '1.5px solid rgba(207,238,240,0.6)',
            boxShadow: '0 0 12px rgba(95,214,208,0.35)',
            animation: 'tapRipple 0.72s cubic-bezier(0.22,0.61,0.36,1) forwards',
          }}
        />
      ))}
    </div>
  )
}
