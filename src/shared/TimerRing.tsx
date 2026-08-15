import { t } from './i18n'

export const TIMED_MS = 60_000
const RING_R = 40
const RING_C = 2 * Math.PI * RING_R

export function starsForTimed(asked: number, correct: number): number {
  if (asked === 0) return 0
  const acc = correct / asked
  if (asked >= 8 && acc >= 0.9) return 3
  if (acc >= 0.7) return 2
  return 1
}

export function TimerRing({ leftMs, totalMs }: { leftMs: number; totalMs: number }) {
  const frac = Math.max(0, Math.min(1, leftMs / totalMs))
  const secs = Math.ceil(leftMs / 1000)
  const tone = secs <= 8 ? 'hot' : secs <= 20 ? 'warm' : 'ok'
  return (
    <div className={`timer-ring ${tone}`} role="timer" aria-label={`${secs}`}>
      <svg className="timer-svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="timer-track" cx="50" cy="50" r={RING_R} />
        <circle
          className="timer-fill"
          cx="50"
          cy="50"
          r={RING_R}
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - frac)}
        />
      </svg>
      <div className="timer-center">
        <span className="timer-num">{secs}</span>
        <span className="timer-unit">{t.seconds}</span>
      </div>
    </div>
  )
}
