import { useEffect, useRef, useState } from 'react'
import { t } from '../../shared/i18n'

const BALL = 40
const CUT = 22

function rowWidth(balls: number) {
  if (balls <= 0) return 0
  return balls * BALL + Math.max(0, balls - 1) * CUT
}

function BallRow({
  from,
  to,
  painted,
  cuts,
  onTogglePaint,
  onToggleCut,
}: {
  from: number
  to: number
  painted: boolean[]
  cuts: boolean[]
  onTogglePaint: (i: number) => void
  onToggleCut: (i: number) => void
}) {
  const nodes = []
  for (let i = from; i < to; i++) {
    nodes.push(
      <button
        key={`b${i}`}
        type="button"
        className={painted[i] ? 'obj-ball on' : 'obj-ball'}
        aria-pressed={painted[i]}
        aria-label={`${t.fracOfItems} ${i + 1}`}
        onClick={() => onTogglePaint(i)}
      />,
    )
    if (i < to - 1) {
      nodes.push(
        <button
          key={`c${i}`}
          type="button"
          className={cuts[i] ? 'obj-cut on' : 'obj-cut'}
          aria-pressed={cuts[i]}
          onClick={() => onToggleCut(i)}
        />,
      )
    }
  }
  return <div className="obj-row">{nodes}</div>
}

export function ObjectLine({
  total,
  painted,
  cuts,
  onTogglePaint,
  onToggleCut,
}: {
  total: number
  painted: boolean[]
  cuts: boolean[]
  onTogglePaint: (i: number) => void
  onToggleCut: (i: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [twoRows, setTwoRows] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const two = rowWidth(total) > w
      setTwoRows(two)
      const perRow = two ? Math.ceil(total / 2) : total
      const need = rowWidth(perRow)
      const f = need > 0 && w > 0 ? Math.min(1, w / need) : 1
      el.style.setProperty('--obj-ball', `${BALL * f}px`)
      el.style.setProperty('--obj-cut', `${CUT * f}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [total])

  const mid = Math.ceil(total / 2)
  const rowProps = { painted, cuts, onTogglePaint, onToggleCut }

  return (
    <div className="obj-line" dir="ltr" ref={ref}>
      <div className="obj-line-inner">
        {twoRows ? (
          <>
            <BallRow from={0} to={mid} {...rowProps} />
            <BallRow from={mid} to={total} {...rowProps} />
          </>
        ) : (
          <BallRow from={0} to={total} {...rowProps} />
        )}
      </div>
    </div>
  )
}
