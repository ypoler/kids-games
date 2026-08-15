type PizzaProps = {
  n: number
  d: number
}

export function pizzaFills(n: number, d: number): number[] {
  const fills: number[] = []
  let left = n
  while (left > 0) {
    const fill = Math.min(d, left)
    fills.push(fill)
    left -= fill
  }
  return fills.length ? fills : [0]
}

export function Pizza({ n, d }: PizzaProps) {
  const cx = 100
  const cy = 100
  const r = 78
  const start0 = -Math.PI / 2
  const slices = Array.from({ length: d }, (_, i) => {
    const a0 = start0 + (i * 2 * Math.PI) / d
    const a1 = start0 + ((i + 1) * 2 * Math.PI) / d
    return { i, a0, a1, filled: i < n }
  })

  return (
    <svg className="pizza" viewBox="0 0 200 200" aria-hidden="true">
      <circle className="pizza-crust" cx={cx} cy={cy} r={92} />
      {slices.map((s) => (
        <path
          key={s.i}
          className={s.filled ? 'pizza-slice on' : 'pizza-slice'}
          d={wedge(cx, cy, r, s.a0, s.a1)}
        />
      ))}
      {slices.map((s) => (
        <line
          key={`cut-${s.i}`}
          className="pizza-cut"
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(s.a0)}
          y2={cy + r * Math.sin(s.a0)}
        />
      ))}
      <circle className="pizza-hub" cx={cx} cy={cy} r={6} />
    </svg>
  )
}

export function PizzaRow({ n, d }: PizzaProps) {
  return (
    <div className="pizza-row" role="img" aria-label={`${n} / ${d}`}>
      {pizzaFills(n, d).map((fill, i) => (
        <Pizza key={i} n={fill} d={d} />
      ))}
    </div>
  )
}

function wedge(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0)
  const y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1)
  const y1 = cy + r * Math.sin(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
}
