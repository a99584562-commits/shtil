import { useEffect, useRef, useState } from 'react'

/**
 * Gentle idle "breath" for the orb on prep/done screens, so it feels alive and
 * previews the coming rhythm. Returns a 0..1 scale on a slow sine. Respects
 * reduce-motion (system or in-app), settling to a calm mid value.
 */
export function useIdleBreath(active: boolean, period = 11): number {
  const [scale, setScale] = useState(0.5)
  const raf = useRef(0)

  useEffect(() => {
    if (!active) return
    const reduce =
      (typeof matchMedia !== 'undefined' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches) ||
      document.documentElement.classList.contains('reduce-motion')
    if (reduce) {
      setScale(0.5)
      return
    }
    const start = performance.now()
    const tick = () => {
      const t = (performance.now() - start) / 1000
      const phase = (t % period) / period
      setScale((1 + Math.sin(phase * Math.PI * 2 - Math.PI / 2)) / 2)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [active, period])

  return scale
}
