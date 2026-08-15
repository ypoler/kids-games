export type SessionLength = 5 | 10 | 0

export type RoundGoal = { type: 'timed' } | { type: 'questions'; count: 5 | 10 }

export type PersonalBests = {
  timed: number
  q5: number
  q10: number
}

export function defaultRound(): RoundGoal {
  return { type: 'questions', count: 10 }
}

export function defaultBests(): PersonalBests {
  return { timed: 0, q5: 0, q10: 0 }
}

export function resolveRound(
  raw: unknown,
  timedFlag?: boolean,
  childSession?: SessionLength,
): RoundGoal {
  if (raw && typeof raw === 'object' && 'type' in raw) {
    const r = raw as RoundGoal
    if (r.type === 'timed') return { type: 'timed' }
    if (r.type === 'questions' && (r.count === 5 || r.count === 10)) {
      return { type: 'questions', count: r.count }
    }
  }
  if (timedFlag) return { type: 'timed' }
  if (childSession === 5 || childSession === 10) return { type: 'questions', count: childSession }
  return defaultRound()
}

export function bestKey(round: RoundGoal): keyof PersonalBests {
  return round.type === 'timed' ? 'timed' : round.count === 5 ? 'q5' : 'q10'
}

export function bestFor(bests: PersonalBests, round: RoundGoal): number {
  return bests[bestKey(round)] ?? 0
}

export function withBest(bests: PersonalBests, round: RoundGoal, correct: number): PersonalBests {
  const k = bestKey(round)
  return { ...bests, [k]: Math.max(bests[k] ?? 0, correct) }
}

export type Player = {
  id: string
  name: string
  googleSub?: string
  email?: string
  picture?: string
}

export type GameId = 'multiplication' | 'vocab-mc' | 'vocab-match'

export type ThemeMode = 'light' | 'dark' | 'system'

export type GeneralSettings = {
  sound: boolean
  theme: ThemeMode
}

export type ChildSettings = {
  sessionLength: SessionLength
}

export type MultiplicationSettings = {
  tables: number[]
  missing: boolean
  round: RoundGoal
}

export type VocabMcSettings = {
  packIds: string[]
  heToEn: boolean
  round: RoundGoal
}

export type VocabMatchSettings = {
  packIds: string[]
  round: RoundGoal
}

/** Empty packIds = all groups. This sentinel = none selected. */
export const PACKS_NONE = '__none__'

export function isAllPacks(packIds: string[]) {
  return packIds.length === 0
}

export function isNoPacks(packIds: string[]) {
  return packIds.includes(PACKS_NONE)
}

export function filterPacks<T extends { id: string }>(packs: T[], packIds: string[]): T[] {
  if (isAllPacks(packIds)) return packs
  if (isNoPacks(packIds)) return []
  return packs.filter((p) => packIds.includes(p.id))
}

export type ChildGameSettings = {
  multiplication: MultiplicationSettings
  vocabMc: VocabMcSettings
  vocabMatch: VocabMatchSettings
}

export type FactKey = string

export type FactProgress = {
  seen: number
  streak: number
  lastCorrect: boolean
}

export type WordProgress = {
  streak: number
  due: number
  lastCorrect: boolean
}

export type ProfileProgress = {
  lastGame: GameId | 'vocab' | null
  multiplication: {
    facts: Record<FactKey, FactProgress>
    bests: PersonalBests
    bestTimed?: number
  }
  vocabMc: { bests: PersonalBests }
  vocabMatch: { bests: PersonalBests }
  vocab: {
    words: Record<string, WordProgress>
  }
}

export type OutboxSession = {
  client_id: string
  timestamp: string
  player: string
  game: GameId
  mode: string
  pack_or_tables: string
  asked: number
  correct: number
  duration_sec: number
  stars_or_score: number
  device: 'ipad' | 'flex' | 'phone' | 'other'
}

export type AppState = {
  version: 4
  players: Player[]
  currentPlayerId: string | null
  general: GeneralSettings
  childSettings: Record<string, ChildSettings>
  gameSettings: Record<string, ChildGameSettings>
  progress: Record<string, ProfileProgress>
  outbox: OutboxSession[]
}

export const PROFILE_COLORS = [
  '#2a6f97',
  '#c44536',
  '#2d6a4f',
  '#7b2cbf',
  '#b08968',
] as const

export function colorForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % PROFILE_COLORS.length
  return PROFILE_COLORS[h]!
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function defaultGeneral(): GeneralSettings {
  return { sound: true, theme: 'system' }
}

export function defaultChildSettings(): ChildSettings {
  return { sessionLength: 10 }
}

export function defaultMultiplicationSettings(): MultiplicationSettings {
  return { tables: [2, 3, 4, 5], missing: false, round: defaultRound() }
}

export function defaultVocabMcSettings(): VocabMcSettings {
  return { packIds: [], heToEn: false, round: defaultRound() }
}

export function defaultVocabMatchSettings(): VocabMatchSettings {
  return { packIds: [], round: defaultRound() }
}

export function defaultGameSettings(): ChildGameSettings {
  return {
    multiplication: defaultMultiplicationSettings(),
    vocabMc: defaultVocabMcSettings(),
    vocabMatch: defaultVocabMatchSettings(),
  }
}

export function resolvedChild(state: AppState, playerId: string): ChildSettings {
  return { ...defaultChildSettings(), ...state.childSettings[playerId] }
}

export function resolvedGames(state: AppState, playerId: string): ChildGameSettings {
  const g = state.gameSettings[playerId] as
    | (Partial<ChildGameSettings> & {
        vocab?: { packIds?: string[]; heToEn?: boolean }
        multiplication?: Partial<MultiplicationSettings> & { mode?: string; timed?: boolean }
        vocabMc?: Partial<VocabMcSettings> & { timed?: boolean }
        vocabMatch?: Partial<VocabMatchSettings> & { timed?: boolean }
      })
    | undefined
  const rawMult = g?.multiplication
  const { mode: _legacyMode, timed: _legacyTimed, ...multRest } = rawMult ?? {}
  const rawMode = String(rawMult?.mode ?? 'mix')
  const childSession = state.childSettings[playerId]?.sessionLength
  const legacyPacks = g?.vocab?.packIds ?? []
  return {
    multiplication: {
      ...defaultMultiplicationSettings(),
      ...multRest,
      missing: rawMult?.missing ?? rawMode === 'missing',
      round: resolveRound(
        rawMult?.round,
        Boolean(rawMult?.timed) || rawMode === 'timed',
        childSession,
      ),
    },
    vocabMc: {
      ...defaultVocabMcSettings(),
      packIds: legacyPacks,
      heToEn: Boolean(g?.vocab?.heToEn),
      ...g?.vocabMc,
      round: resolveRound(g?.vocabMc?.round, g?.vocabMc?.timed, childSession),
    },
    vocabMatch: {
      ...defaultVocabMatchSettings(),
      packIds: legacyPacks,
      ...g?.vocabMatch,
      round: resolveRound(g?.vocabMatch?.round, g?.vocabMatch?.timed, childSession),
    },
  }
}

export function resolvedBests(progress: ProfileProgress, game: GameId): PersonalBests {
  if (game === 'multiplication') {
    const b = progress.multiplication.bests ?? defaultBests()
    return { ...defaultBests(), ...b, timed: Math.max(b.timed ?? 0, progress.multiplication.bestTimed ?? 0) }
  }
  if (game === 'vocab-mc') return { ...defaultBests(), ...progress.vocabMc?.bests }
  return { ...defaultBests(), ...progress.vocabMatch?.bests }
}
