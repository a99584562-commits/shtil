// Drives the global --px / --py CSS variables from pointer movement (desktop)
// and device tilt (phone). Background glows and the orb read these for a gentle
// "living wallpaper" parallax. iOS needs a one-time permission, requested from a
// real gesture via requestTilt().

const AMP = 14 // px of travel at the extremes
let started = false
let tiltAsked = false

export function initParallax() {
  if (typeof window === 'undefined' || started) return
  started = true
  const root = document.documentElement
  const reduced = () => root.classList.contains('reduce-motion')

  let targetX = 0
  let targetY = 0
  let curX = 0
  let curY = 0

  const onPointer = (e: PointerEvent) => {
    if (reduced()) {
      targetX = targetY = 0
      return
    }
    targetX = ((e.clientX / window.innerWidth) * 2 - 1) * AMP
    targetY = ((e.clientY / window.innerHeight) * 2 - 1) * AMP
  }

  const clamp = (v: number) => Math.max(-1, Math.min(1, v))
  const onOrient = (e: DeviceOrientationEvent) => {
    if (reduced()) {
      targetX = targetY = 0
      return
    }
    const gamma = e.gamma ?? 0 // left/right [-90,90]
    const beta = e.beta ?? 0 // front/back [-180,180]
    targetX = clamp(gamma / 28) * AMP
    targetY = clamp((beta - 40) / 28) * AMP
  }

  const loop = () => {
    curX += (targetX - curX) * 0.07
    curY += (targetY - curY) * 0.07
    root.style.setProperty('--px', `${curX.toFixed(2)}px`)
    root.style.setProperty('--py', `${curY.toFixed(2)}px`)
    requestAnimationFrame(loop)
  }

  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('deviceorientation', onOrient)
  requestAnimationFrame(loop)
}

/** Ask iOS for motion access — must be called from a user gesture (e.g. session start). */
export async function requestTilt() {
  if (tiltAsked) return
  tiltAsked = true
  const D = (window as any).DeviceOrientationEvent
  if (D && typeof D.requestPermission === 'function') {
    try {
      await D.requestPermission()
    } catch {
      /* denied or unavailable — pointer parallax still works */
    }
  }
}
