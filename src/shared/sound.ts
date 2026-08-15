let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    return ctx
  } catch {
    return null
  }
}

function beep(freq: number, duration: number, type: OscillatorType = 'sine') {
  const ac = audio()
  if (!ac) return
  void ac.resume()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = 0.08
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
  osc.stop(ac.currentTime + duration)
}

export function playCorrect(enabled: boolean) {
  if (!enabled) return
  beep(660, 0.12)
  setTimeout(() => beep(880, 0.14), 90)
}

export function playWrong(enabled: boolean) {
  if (!enabled) return
  beep(220, 0.22, 'square')
}

export function playTap(enabled: boolean) {
  if (!enabled) return
  beep(440, 0.05)
}
