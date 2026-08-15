import type { AddMax } from '../../shared/types'

export type ArithOp = '+' | '-'
export type ArithProblem = { a: number; b: number; op: ArithOp; answer: number }

function randInt(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}

export function nextProblem(max: AddMax, prev?: ArithProblem | null): ArithProblem {
  let p: ArithProblem
  for (let i = 0; i < 12; i++) {
    p = makeProblem(max)
    if (!prev || p.a !== prev.a || p.b !== prev.b || p.op !== prev.op) return p
  }
  return makeProblem(max)
}

function makeProblem(max: AddMax): ArithProblem {
  const op: ArithOp = Math.random() < 0.5 ? '+' : '-'
  if (op === '+') {
    const a = randInt(0, max)
    const b = randInt(0, max - a)
    return { a, b, op, answer: a + b }
  }
  const a = randInt(0, max)
  const b = randInt(0, a)
  return { a, b, op, answer: a - b }
}
