// Web Audio sound engine — no asset files, synthesised on the fly.
// Enabled state is controlled by the Settings context.

let enabled = true
let actx = null

export function setSoundEnabled(on) {
  enabled = on
}

function ctx() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      actx = null
    }
  }
  return actx
}

function tone(freq = 440, dur = 0.08, type = 'sine', vol = 0.08) {
  if (!enabled) return
  const ac = ctx()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume()
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(vol, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur)
  o.connect(g).connect(ac.destination)
  o.start()
  o.stop(ac.currentTime + dur)
}

export const sfx = {
  flip: () => tone(520, 0.05, 'triangle', 0.06),
  match: () => {
    tone(660, 0.06)
    setTimeout(() => tone(880, 0.1), 70)
  },
  miss: () => tone(180, 0.12, 'sawtooth', 0.07),
  win: () => {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => tone(f, 0.13, 'triangle', 0.09), i * 100)
    )
  },
  pick: () => tone(700, 0.04, 'square', 0.05),
}
