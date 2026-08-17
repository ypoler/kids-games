import type { FracMax } from '../../shared/types'

export type OfProblem = {
  total: number
  n: number
  d: number
  answer: number
}

const MAX_TOTAL = 16

function randInt(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}

export function nextOfProblem(maxD: FracMax, prev?: OfProblem | null): OfProblem {
  for (let i = 0; i < 32; i++) {
    const d = randInt(2, maxD)
    const ks: number[] = []
    for (let k = 1; k * d <= MAX_TOTAL; k++) ks.push(k)
    if (!ks.length) continue
    const prefer = ks.filter((k) => k >= 2)
    const pool = prefer.length ? prefer : ks
    const k = pool[randInt(0, pool.length - 1)]!
    const n = randInt(1, d - 1)
    const total = k * d
    const answer = k * n
    if (prev && prev.total === total && prev.n === n && prev.d === d) continue
    return { total, n, d, answer }
  }
  return { total: 12, n: 3, d: 4, answer: 9 }
}
