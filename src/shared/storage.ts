import {
  defaultBests,
  defaultChildSettings,
  defaultGameSettings,
  defaultGeneral,
  type AppState,
  type ProfileProgress,
} from './types'

const KEY = 'kids-games-v4'

function uid(): string {
  return crypto.randomUUID()
}

function emptyProgress(): ProfileProgress {
  return {
    lastGame: null,
    multiplication: { facts: {}, bests: defaultBests() },
    vocabMc: { bests: defaultBests() },
    vocabMatch: { bests: defaultBests() },
    vocab: { words: {} },
  }
}

export function defaultState(): AppState {
  return {
    version: 4,
    players: [],
    currentPlayerId: null,
    general: defaultGeneral(),
    childSettings: {},
    gameSettings: {},
    progress: {},
    outbox: [],
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    if (parsed.version !== 4) return defaultState()
    if (!parsed.outbox) parsed.outbox = []
    if (!parsed.players) parsed.players = []
    if (!parsed.general) parsed.general = defaultGeneral()
    if (!parsed.childSettings) parsed.childSettings = {}
    if (!parsed.gameSettings) parsed.gameSettings = {}
    return parsed
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function ensurePlayer(state: AppState, userId: string): AppState {
  let next = state
  if (!next.progress[userId]) {
    next = { ...next, progress: { ...next.progress, [userId]: emptyProgress() } }
  }
  if (!next.childSettings[userId]) {
    next = { ...next, childSettings: { ...next.childSettings, [userId]: defaultChildSettings() } }
  }
  if (!next.gameSettings[userId]) {
    next = { ...next, gameSettings: { ...next.gameSettings, [userId]: defaultGameSettings() } }
  }
  return next
}

export { uid, emptyProgress }
