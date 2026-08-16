import type { RoundGoal } from '../../shared/types'

export type VocabWord = {
  id: string
  en: string
  he: string
  transliteration?: string
}

export type VocabPack = {
  id: string
  he: string
  en: string
  words: VocabWord[]
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function nextWord(
  words: VocabWord[],
  progress: Record<string, { due: number; streak: number }>,
): VocabWord {
  const now = Date.now()
  const due = words.filter((w) => (progress[w.id]?.due ?? 0) <= now)
  const pool = due.length ? due : words
  pool.sort((a, b) => (progress[a.id]?.streak ?? 0) - (progress[b.id]?.streak ?? 0))
  const top = pool.slice(0, Math.max(3, Math.ceil(pool.length / 3)))
  return top[Math.floor(Math.random() * top.length)]!
}

export function packIdOf(word: VocabWord) {
  const i = word.id.indexOf('::')
  return i === -1 ? word.id : word.id.slice(0, i)
}

function answerLabel(word: VocabWord, reverse: boolean) {
  return (reverse ? word.en : word.he).trim().toLowerCase()
}

function takeDistinct(
  from: VocabWord[],
  n: number,
  reverse: boolean,
  used: Set<string>,
): VocabWord[] {
  const out: VocabWord[] = []
  for (const w of from) {
    if (out.length >= n) break
    const k = answerLabel(w, reverse)
    if (!k || used.has(k)) continue
    used.add(k)
    out.push(w)
  }
  return out
}

export function choices(correct: VocabWord, all: VocabWord[], reverse: boolean): string[] {
  const pack = packIdOf(correct)
  const others = all.filter((w) => w.id !== correct.id)
  const same = shuffle(others.filter((w) => packIdOf(w) === pack))
  const rest = shuffle(others.filter((w) => packIdOf(w) !== pack))
  const used = new Set([answerLabel(correct, reverse)])
  const picked = [
    ...takeDistinct(same, 3, reverse, used),
    ...takeDistinct(rest, 3, reverse, used),
  ].slice(0, 3)
  const opts = [correct, ...picked].map((w) => (reverse ? w.en : w.he))
  return shuffle(opts)
}

function labelKey(s: string) {
  return s.trim().toLowerCase()
}

function uniqueBoard(words: VocabWord[], n: number): VocabWord[] {
  const picked: VocabWord[] = []
  const ens = new Set<string>()
  const hes = new Set<string>()
  for (const w of words) {
    if (picked.length >= n) break
    const en = labelKey(w.en)
    const he = labelKey(w.he)
    if (!en || !he || ens.has(en) || hes.has(he)) continue
    ens.add(en)
    hes.add(he)
    picked.push(w)
  }
  return picked
}

export function matchBoardSize(round: RoundGoal, asked: number) {
  if (round.type !== 'questions' || !round.count) return 6
  return Math.min(6, Math.max(1, round.count - asked))
}

export function matchPairs(words: VocabWord[], n: number): VocabWord[] {
  const want = Math.min(n, words.length)
  let best: VocabWord[] = []
  for (let i = 0; i < 16; i++) {
    const picked = uniqueBoard(shuffle(words), want)
    if (picked.length > best.length) best = picked
    if (best.length >= want) break
  }
  return best
}
