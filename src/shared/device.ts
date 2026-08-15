import type { OutboxSession } from './types'

export function guessDevice(): OutboxSession['device'] {
  const ua = navigator.userAgent
  if (/iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ipad'
  if (/CrOS/.test(ua)) return 'flex'
  if (/Mobi|Android/i.test(ua)) return 'phone'
  return 'other'
}
