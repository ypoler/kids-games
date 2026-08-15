import type { FracMax } from '../../shared/types'

export type Fraction = { n: number; d: number }

export type FractionProblem = Fraction & { choices: Fraction[] }

function randInt(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}

export function sameValue(a: Fraction, b: Fraction) {
  return a.n * b.d === b.n * a.d
}

export function fracKey(f: Fraction) {
  return `${f.n}/${f.d}`
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const MAX_PIZZAS = 3

function pizzaCount(): number {
  const r = Math.random()
  if (r < 0.55) return 1
  if (r < 0.85) return 2
  return MAX_PIZZAS
}

function pickFraction(maxD: FracMax, prev?: Fraction | null): Fraction {
  for (let i = 0; i < 16; i++) {
    const d = randInt(2, maxD)
    const pizzas = pizzaCount()
    const lo = pizzas === 1 ? 1 : (pizzas - 1) * d + 1
    const hi = pizzas === 1 ? d - 1 : pizzas * d
    const n = randInt(lo, hi)
    if (!prev || prev.n !== n || prev.d !== d) return { n, d }
  }
  const d = randInt(2, maxD)
  return { n: randInt(1, d - 1), d }
}

function maxNum(d: number) {
  return MAX_PIZZAS * Math.max(d, 2)
}

function distractors(correct: Fraction, maxD: FracMax): Fraction[] {
  const seen = new Set([fracKey(correct)])
  const pool: Fraction[] = []
  const add = (n: number, d: number) => {
    if (d < 2 || d > Math.max(maxD, 12) || n < 1 || n > maxNum(d)) return
    const f = { n, d }
    const k = fracKey(f)
    if (seen.has(k) || sameValue(f, correct)) return
    seen.add(k)
    pool.push(f)
  }

  for (let n = 1; n <= maxNum(correct.d); n++) add(n, correct.d)
  for (const d of [correct.d - 1, correct.d + 1, correct.d - 2, correct.d + 2, 2, 3, 4, maxD]) {
    add(correct.n, d)
    add(correct.n - 1, d)
    add(correct.n + 1, d)
  }
  add(correct.d - (correct.n % correct.d || correct.d), correct.d)
  for (let d = 2; d <= maxD; d++) {
    for (let n = 1; n <= maxNum(d); n++) add(n, d)
  }

  const picked = shuffle(pool).slice(0, 3)
  let guard = 0
  while (picked.length < 3 && guard++ < 40) {
    const d = randInt(2, Math.max(maxD, 4))
    const n = randInt(1, maxNum(d))
    if (!sameValue({ n, d }, correct) && !picked.some((p) => fracKey(p) === fracKey({ n, d }))) {
      picked.push({ n, d })
    }
  }
  return picked
}

export function nextProblem(maxD: FracMax, prev?: Fraction | null): FractionProblem {
  const { n, d } = pickFraction(maxD, prev)
  const choices = shuffle([{ n, d }, ...distractors({ n, d }, maxD)])
  return { n, d, choices }
}
