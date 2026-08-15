export type Fact = { a: number; b: number; product: number }

export function factKey(a: number, b: number): string {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return `${lo}x${hi}`
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export function nextFact(
  tables: number[],
  facts: Record<string, { streak: number }>,
  consecutiveCorrect: number,
  consecutiveWrong: number,
): Fact {
  const pool = tables.length ? tables : [2, 3, 4, 5]
  let maxN = 10
  if (consecutiveWrong >= 2) maxN = Math.min(5, Math.max(...pool))
  else if (consecutiveCorrect >= 3) maxN = 10

  const candidates: Fact[] = []
  for (const a of pool) {
    for (let b = 1; b <= maxN; b++) {
      candidates.push({ a, b, product: a * b })
    }
  }
  const usable = candidates.length ? candidates : [{ a: 2, b: 2, product: 4 }]

  const weighted = usable.map((f) => {
    const st = facts[factKey(f.a, f.b)]?.streak ?? 0
    const weight = Math.max(1, 6 - st)
    return { f, weight }
  })
  const total = weighted.reduce((s, w) => s + w.weight, 0)
  let r = Math.random() * total
  for (const w of weighted) {
    r -= w.weight
    if (r <= 0) return maybeSwap(w.f)
  }
  return maybeSwap(pick(usable))
}

function maybeSwap(f: Fact): Fact {
  if (Math.random() < 0.5) return { a: f.b, b: f.a, product: f.product }
  return f
}
