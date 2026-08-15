import type { OutboxSession } from './types'
import { guessDevice } from './device'
import { uid } from './storage'

/** Queue a finished round for later client-only Sheets publish (no OAuth in v1). */
export function makeSession(partial: Omit<OutboxSession, 'client_id' | 'timestamp' | 'device'>): OutboxSession {
  return {
    ...partial,
    client_id: uid(),
    timestamp: new Date().toISOString(),
    device: guessDevice(),
  }
}
