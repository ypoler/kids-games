import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { makeSession } from './outbox'
import { emptyProgress, ensurePlayer, loadState, saveState, uid } from './storage'
import {
  colorForId,
  defaultChildSettings,
  defaultGeneral,
  normalizeName,
  resolvedBests,
  resolvedChild,
  resolvedGames,
  withBest,
  type AppState,
  type ChildGameSettings,
  type ChildSettings,
  type GeneralSettings,
  type GameId,
  type OutboxSession,
  type Player,
  type RoundGoal,
} from './types'

type ActivePlayer = Player & { color: string }

type Store = {
  state: AppState
  enterName: (name: string) => void
  selectPlayer: (id: string) => void
  clearCurrent: () => void
  renamePlayer: (id: string, name: string) => void
  updateGeneral: (patch: Partial<GeneralSettings>) => void
  updateChildSettings: (playerId: string, patch: Partial<ChildSettings>) => void
  updateGameSettings: (
    playerId: string,
    patch: {
      multiplication?: Partial<ChildGameSettings['multiplication']>
      vocabMc?: Partial<ChildGameSettings['vocabMc']>
      vocabMatch?: Partial<ChildGameSettings['vocabMatch']>
    },
  ) => void
  resetProgress: (userId: string) => void
  setLastGame: (game: GameId) => void
  recordFact: (key: string, correct: boolean) => void
  recordWord: (wordId: string, correct: boolean) => void
  recordRoundBest: (game: GameId, round: RoundGoal, correct: number) => void
  enqueueSession: (partial: Omit<OutboxSession, 'client_id' | 'timestamp' | 'device'>) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  const commit = useCallback((updater: (s: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }, [])

  const enterName = useCallback(
    (raw: string) => {
      const name = raw.trim().replace(/\s+/g, ' ')
      if (!name) return
      const key = normalizeName(name)
      commit((s) => {
        const existing = s.players.find((p) => normalizeName(p.name) === key)
        if (existing) {
          return ensurePlayer({ ...s, currentPlayerId: existing.id }, existing.id)
        }
        const id = uid()
        return ensurePlayer(
          {
            ...s,
            players: [...s.players, { id, name }],
            currentPlayerId: id,
          },
          id,
        )
      })
    },
    [commit],
  )

  const selectPlayer = useCallback(
    (id: string) => {
      commit((s) => ensurePlayer({ ...s, currentPlayerId: id }, id))
    },
    [commit],
  )

  const clearCurrent = useCallback(() => {
    commit((s) => ({ ...s, currentPlayerId: null }))
  }, [commit])

  const renamePlayer = useCallback(
    (id: string, raw: string) => {
      const name = raw.trim().replace(/\s+/g, ' ')
      if (!name) return
      commit((s) => ({
        ...s,
        players: s.players.map((p) => (p.id === id ? { ...p, name } : p)),
      }))
    },
    [commit],
  )

  const updateGeneral = useCallback(
    (patch: Partial<GeneralSettings>) => {
      commit((s) => ({ ...s, general: { ...s.general, ...patch } }))
    },
    [commit],
  )

  const updateChildSettings = useCallback(
    (playerId: string, patch: Partial<ChildSettings>) => {
      commit((s) => {
        const cur = s.childSettings[playerId] ?? defaultChildSettings()
        return {
          ...s,
          childSettings: { ...s.childSettings, [playerId]: { ...cur, ...patch } },
        }
      })
    },
    [commit],
  )

  const updateGameSettings = useCallback(
    (
      playerId: string,
      patch: {
        multiplication?: Partial<ChildGameSettings['multiplication']>
        vocabMc?: Partial<ChildGameSettings['vocabMc']>
        vocabMatch?: Partial<ChildGameSettings['vocabMatch']>
      },
    ) => {
      commit((s) => {
        const cur = resolvedGames(s, playerId)
        return {
          ...s,
          gameSettings: {
            ...s.gameSettings,
            [playerId]: {
              multiplication: { ...cur.multiplication, ...patch.multiplication },
              vocabMc: { ...cur.vocabMc, ...patch.vocabMc },
              vocabMatch: { ...cur.vocabMatch, ...patch.vocabMatch },
            },
          },
        }
      })
    },
    [commit],
  )

  const resetProgress = useCallback(
    (userId: string) => {
      commit((s) => ({
        ...s,
        progress: { ...s.progress, [userId]: emptyProgress() },
      }))
    },
    [commit],
  )

  const withUser = useCallback(
    (updater: (s: AppState, userId: string) => AppState) => {
      commit((s) => {
        if (!s.currentPlayerId) return s
        return updater(ensurePlayer(s, s.currentPlayerId), s.currentPlayerId)
      })
    },
    [commit],
  )

  const setLastGame = useCallback(
    (game: GameId) => {
      withUser((s, pid) => ({
        ...s,
        progress: {
          ...s.progress,
          [pid]: { ...s.progress[pid], lastGame: game },
        },
      }))
    },
    [withUser],
  )

  const recordFact = useCallback(
    (key: string, correct: boolean) => {
      withUser((s, pid) => {
        const prev = s.progress[pid].multiplication.facts[key] ?? {
          seen: 0,
          streak: 0,
          lastCorrect: false,
        }
        return {
          ...s,
          progress: {
            ...s.progress,
            [pid]: {
              ...s.progress[pid],
              multiplication: {
                ...s.progress[pid].multiplication,
                facts: {
                  ...s.progress[pid].multiplication.facts,
                  [key]: {
                    seen: prev.seen + 1,
                    streak: correct ? prev.streak + 1 : 0,
                    lastCorrect: correct,
                  },
                },
              },
            },
          },
        }
      })
    },
    [withUser],
  )

  const recordWord = useCallback(
    (wordId: string, correct: boolean) => {
      withUser((s, pid) => {
        const prev = s.progress[pid].vocab.words[wordId] ?? {
          streak: 0,
          due: 0,
          lastCorrect: false,
        }
        const now = Date.now()
        const streak = correct ? prev.streak + 1 : 0
        let due = now + 10 * 60 * 1000
        if (correct && streak >= 3) due = now + 2 * 24 * 60 * 60 * 1000
        else if (correct) due = now + 12 * 60 * 60 * 1000
        return {
          ...s,
          progress: {
            ...s.progress,
            [pid]: {
              ...s.progress[pid],
              vocab: {
                words: {
                  ...s.progress[pid].vocab.words,
                  [wordId]: { streak, due, lastCorrect: correct },
                },
              },
            },
          },
        }
      })
    },
    [withUser],
  )

  const recordRoundBest = useCallback(
    (game: GameId, round: RoundGoal, correct: number) => {
      withUser((s, pid) => {
        const cur = s.progress[pid]
        const nextBests = withBest(resolvedBests(cur, game), round, correct)
        if (game === 'multiplication') {
          return {
            ...s,
            progress: {
              ...s.progress,
              [pid]: {
                ...cur,
                multiplication: { ...cur.multiplication, bests: nextBests },
              },
            },
          }
        }
        if (game === 'vocab-mc') {
          return {
            ...s,
            progress: {
              ...s.progress,
              [pid]: {
                ...cur,
                vocabMc: { bests: nextBests },
              },
            },
          }
        }
        return {
          ...s,
          progress: {
            ...s.progress,
            [pid]: {
              ...cur,
              vocabMatch: { bests: nextBests },
            },
          },
        }
      })
    },
    [withUser],
  )

  const enqueueSession = useCallback(
    (partial: Omit<OutboxSession, 'client_id' | 'timestamp' | 'device'>) => {
      const row = makeSession(partial)
      commit((s) => {
        if (s.outbox.some((x) => x.client_id === row.client_id)) return s
        return { ...s, outbox: [...s.outbox, row] }
      })
    },
    [commit],
  )

  const value = useMemo(
    () => ({
      state,
      enterName,
      selectPlayer,
      clearCurrent,
      renamePlayer,
      updateGeneral,
      updateChildSettings,
      updateGameSettings,
      resetProgress,
      setLastGame,
      recordFact,
      recordWord,
      recordRoundBest,
      enqueueSession,
    }),
    [
      state,
      enterName,
      selectPlayer,
      clearCurrent,
      renamePlayer,
      updateGeneral,
      updateChildSettings,
      updateGameSettings,
      resetProgress,
      setLastGame,
      recordFact,
      recordWord,
      recordRoundBest,
      enqueueSession,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

export function useActiveProfile() {
  const { state } = useStore()
  const player = state.players.find((p) => p.id === state.currentPlayerId)
  if (!player) throw new Error('no player')
  const profile: ActivePlayer = {
    ...player,
    color: colorForId(player.id),
  }
  const progress = state.progress[player.id] ?? emptyProgress()
  const child = resolvedChild(state, player.id)
  const games = resolvedGames(state, player.id)
  return {
    profile,
    progress,
    general: state.general ?? defaultGeneral(),
    child,
    multiplication: games.multiplication,
    vocabMc: games.vocabMc,
    vocabMatch: games.vocabMatch,
  }
}
