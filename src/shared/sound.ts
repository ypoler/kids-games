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

export function canSpeakEnglish() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function englishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang))
  return (
    en.find((v) => /en-US/i.test(v.lang) && /google|samsung|android|chrome/i.test(v.name)) ??
    en.find((v) => /en-US/i.test(v.lang)) ??
    en[0]
  )
}

export function speakEnglish(text: string, enabled = true) {
  if (!enabled || !canSpeakEnglish()) return
  const say = text.trim()
  if (!say) return
  const synth = window.speechSynthesis
  const speak = () => {
    const u = new SpeechSynthesisUtterance(say)
    u.lang = 'en-US'
    u.rate = 0.92
    const voice = englishVoice()
    if (voice) u.voice = voice
    synth.cancel()
    synth.speak(u)
  }
  if (synth.getVoices().length) speak()
  else {
    const once = () => {
      synth.removeEventListener('voiceschanged', once)
      speak()
    }
    synth.addEventListener('voiceschanged', once)
    speak()
  }
}

export function stopSpeak() {
  if (!canSpeakEnglish()) return
  window.speechSynthesis.cancel()
}
