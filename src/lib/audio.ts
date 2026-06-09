// All sound is synthesised with the Web Audio API — no audio files, so it stays
// tiny and works fully offline. iOS only allows audio after a user gesture, so
// `ensure()` must be called from within a tap handler before anything plays.

type Maybe<T> = T | null

class AudioEngine {
  private ctx: Maybe<AudioContext> = null
  private master: Maybe<GainNode> = null
  private ambient: Maybe<{ stop: () => void }> = null

  /** Create/resume the context. Call from a user gesture. Returns false if unsupported. */
  async ensure(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return false
    if (!this.ctx) {
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        /* ignore */
      }
    }
    return true
  }

  private now(): number {
    return this.ctx ? this.ctx.currentTime : 0
  }

  /** Soft singing-bowl tone: fundamental plus a couple of inharmonic partials, long decay. */
  bell(freq = 432, peak = 0.5) {
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

  /** Very gentle cue at a breath phase change. rising = inhale, falling = exhale/hold. */
  cue(direction: 'rise' | 'fall' | 'hold') {
    if (!this.ctx || !this.master) return
    const t = this.now()
    const base = direction === 'rise' ? 396 : direction === 'fall' ? 297 : 352
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.08, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    osc.frequency.setValueAtTime(base, t)
    osc.frequency.linearRampToValueAtTime(direction === 'rise' ? base * 1.06 : base * 0.95, t + 0.6)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + 1)
  }

  /** Warm, slow ocean-like pad: low drone + filtered brown noise swelling like waves. */
  startAmbient() {
    if (!this.ctx || !this.master) return
    if (this.ambient) return
    const ctx = this.ctx

    const out = ctx.createGain()
    out.gain.setValueAtTime(0, this.now())
    out.gain.linearRampToValueAtTime(0.18, this.now() + 4)
    out.connect(this.master)

    // Low drone (fundamental + fifth) for warmth.
    const drones: OscillatorNode[] = []
    for (const f of [55, 82.4]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = f < 70 ? 0.5 : 0.28
      osc.connect(g)
      g.connect(out)
      osc.start()
      drones.push(osc)
    }

    // Brown noise → lowpass with a slow LFO on cutoff = gentle "waves".
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

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 480
    filter.Q.value = 0.7

    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.5

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07 // ~14s swell
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 260
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(out)
    noise.start()
    lfo.start()

    this.ambient = {
      stop: () => {
        const tEnd = this.now() + 1.6
        out.gain.cancelScheduledValues(this.now())
        out.gain.setValueAtTime(out.gain.value, this.now())
        out.gain.linearRampToValueAtTime(0, tEnd)
        const stopAll = () => {
          try {
            drones.forEach((d) => d.stop())
            noise.stop()
            lfo.stop()
          } catch {
            /* already stopped */
          }
        }
        setTimeout(stopAll, 1800)
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
