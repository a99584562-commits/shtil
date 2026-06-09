// All sound is synthesised with the Web Audio API — no audio files, so it stays
// tiny and works fully offline. iOS only allows audio after a user gesture, so
// `ensure()` must be called from within a tap handler before anything plays.
//
// Note on iPhone: the hardware mute/silent switch can silence Web Audio. If you
// hear nothing on iPhone, flip the side switch off silent (or use headphones).

type Maybe<T> = T | null

class AudioEngine {
  private ctx: Maybe<AudioContext> = null
  private master: Maybe<GainNode> = null
  private ambient: Maybe<{ stop: () => void }> = null

  /** Create/resume the context + unlock iOS. Call from a user gesture. */
  async ensure(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return false
    if (!this.ctx) {
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 1
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        /* ignore */
      }
    }
    // iOS unlock: play a 1-frame silent buffer inside the gesture.
    try {
      const b = this.ctx.createBuffer(1, 1, this.ctx.sampleRate)
      const s = this.ctx.createBufferSource()
      s.buffer = b
      s.connect(this.ctx.destination)
      s.start(0)
    } catch {
      /* ignore */
    }
    return true
  }

  private now(): number {
    return this.ctx ? this.ctx.currentTime : 0
  }

  /** Soft singing-bowl tone: fundamental plus a couple of inharmonic partials, long decay. */
  bell(freq = 432, peak = 0.55) {
    if (!this.ctx || !this.master) return
    const t = this.now()
    const partials = [
      { ratio: 1, gain: 1, decay: 4.2 },
      { ratio: 2.01, gain: 0.5, decay: 3.2 },
      { ratio: 2.76, gain: 0.28, decay: 2.4 },
      { ratio: 5.4, gain: 0.12, decay: 1.6 },
    ]
    const bus = this.ctx.createGain()
    bus.gain.value = peak
    bus.connect(this.master)
    for (const p of partials) {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * p.ratio
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(p.gain, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay)
      osc.connect(g)
      g.connect(bus)
      osc.start(t)
      osc.stop(t + p.decay + 0.1)
    }
  }

  /** Very gentle cue at a breath phase change. */
  cue(direction: 'rise' | 'fall' | 'hold') {
    if (!this.ctx || !this.master) return
    const t = this.now()
    const base = direction === 'rise' ? 396 : direction === 'fall' ? 297 : 352
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.1, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    osc.frequency.setValueAtTime(base, t)
    osc.frequency.linearRampToValueAtTime(direction === 'rise' ? base * 1.06 : base * 0.95, t + 0.6)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + 1)
  }

  /**
   * Calm ambient pad — a soft, open chord (water/sky) in the audible range so it
   * carries on a phone speaker, with gentle shimmer and an ocean-like wash.
   */
  startAmbient() {
    if (!this.ctx || !this.master || this.ambient) return
    const ctx = this.ctx
    const t0 = this.now()

    // Master ambient bus with a slow 5s fade-in.
    const out = ctx.createGain()
    out.gain.setValueAtTime(0.0001, t0)
    out.gain.linearRampToValueAtTime(0.34, t0 + 5)
    out.connect(this.master)

    const stoppables: { stop: (when?: number) => void }[] = []

    // Soft lowpass keeps the pad warm, never harsh.
    const padFilter = ctx.createBiquadFilter()
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 1500
    padFilter.Q.value = 0.4

    // Breathing tremolo so the pad feels alive (not a flat drone).
    const padGain = ctx.createGain()
    padGain.gain.value = 1
    const trem = ctx.createOscillator()
    trem.frequency.value = 0.09 // ~11s swell
    const tremDepth = ctx.createGain()
    tremDepth.gain.value = 0.14
    trem.connect(tremDepth)
    tremDepth.connect(padGain.gain)
    trem.start(t0)
    stoppables.push(trem)

    padFilter.connect(padGain)
    padGain.connect(out)

    // An open, restful voicing (D — A — D — E): fifths + a sus2 colour.
    const voices = [
      { f: 146.83, g: 0.2, type: 'sine' as OscillatorType, drift: 0.6 },
      { f: 220.0, g: 0.16, type: 'sine' as OscillatorType, drift: -0.5 },
      { f: 293.66, g: 0.13, type: 'triangle' as OscillatorType, drift: 0.4 },
      { f: 329.63, g: 0.08, type: 'sine' as OscillatorType, drift: -0.7 },
    ]
    for (const v of voices) {
      const osc = ctx.createOscillator()
      osc.type = v.type
      osc.frequency.value = v.f
      const g = ctx.createGain()
      g.gain.value = v.g
      osc.connect(g)
      g.connect(padFilter)
      // slow detune drift (±cents) for a watery shimmer
      const drift = ctx.createOscillator()
      drift.frequency.value = 0.05 + Math.abs(v.drift) * 0.03
      const driftAmt = ctx.createGain()
      driftAmt.gain.value = v.drift * 6
      drift.connect(driftAmt)
      driftAmt.connect(osc.detune)
      osc.start(t0)
      drift.start(t0)
      stoppables.push(osc, drift)
    }

    // Ocean wash: brown noise through a bandpass that slowly opens and closes.
    const bufferSec = 3
    const buffer = ctx.createBuffer(1, ctx.sampleRate * bufferSec, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 820
    noiseFilter.Q.value = 0.8
    const noiseLfo = ctx.createOscillator()
    noiseLfo.frequency.value = 0.07 // ~14s waves
    const noiseLfoAmt = ctx.createGain()
    noiseLfoAmt.gain.value = 320
    noiseLfo.connect(noiseLfoAmt)
    noiseLfoAmt.connect(noiseFilter.frequency)
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.12
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(out)
    noise.start(t0)
    noiseLfo.start(t0)
    stoppables.push(noise, noiseLfo)

    this.ambient = {
      stop: () => {
        const now = this.now()
        const end = now + 1.6
        out.gain.cancelScheduledValues(now)
        out.gain.setValueAtTime(out.gain.value, now)
        out.gain.linearRampToValueAtTime(0.0001, end)
        setTimeout(() => {
          for (const s of stoppables) {
            try {
              s.stop()
            } catch {
              /* already stopped */
            }
          }
        }, 1800)
      },
    }
  }

  stopAmbient() {
    if (this.ambient) {
      this.ambient.stop()
      this.ambient = null
    }
  }

  get ambientActive(): boolean {
    return this.ambient !== null
  }
}

export const audio = new AudioEngine()

// Dev-only handle for debugging in the browser console (stripped from prod build).
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as any).__audio = audio
}
