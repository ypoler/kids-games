import { useCallback, useEffect, useRef, useState } from 'react'
import { Shell } from '../../shared/Shell'
import { t } from '../../shared/i18n'
import { playCorrect, playWrong } from '../../shared/sound'
import { useActiveProfile, useStore } from '../../shared/store'
import { AnswerMark, PlayScore, RecapScore, emptyScore, outboxStars, scoreCorrect, scoreWrong, type RunScore } from '../../shared/score'
import { TIMED_MS } from '../../shared/TimerRing'
import { useLeaveFlush } from '../../shared/useLeaveFlush'
import { bestFor, resolvedBests } from '../../shared/types'
import { nextProblem, type ArithProblem } from './engine'

function NumberPad({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']
  return (
    <div className="pad" dir="ltr">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          className={k === 'OK' ? 'tap pad-key ok' : 'tap pad-key'}
          disabled={disabled}
          onClick={() => {
            if (k === '⌫') onChange(value.slice(0, -1))
            else if (k === 'OK') onSubmit()
            else if (value.length < 3) onChange(value + k)
          }}
        >
          {k === 'OK' ? t.check : k}
        </button>
      ))}
    </div>
  )
}

export function AddSubPage() {
  const { recordRoundBest, enqueueSession, setLastGame } = useStore()
  const { profile, progress, general, addSub } = useActiveProfile()
  const round = addSub.round
  const timed = round.type === 'timed'
  const max = addSub.max
  const sessionLength = round.type === 'questions' ? round.count : 0

  const [started, setStarted] = useState(false)
  const [problem, setProblem] = useState<ArithProblem | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [score, setScore] = useState<RunScore>(emptyScore)
  const [runDone, setRunDone] = useState(false)
  const [leftMs, setLeftMs] = useState(TIMED_MS)
  const endsAt = useRef(0)
  const startedAt = useRef(Date.now())
  const timedFlushed = useRef(false)
  const prevBestRef = useRef(0)
  const scoreRef = useRef(score)
  scoreRef.current = score

  const completeRound = (s: RunScore, durationSec: number) => {
    if (timedFlushed.current) return
    timedFlushed.current = true
    prevBestRef.current = bestFor(resolvedBests(progress, 'add-sub'), round)
    recordRoundBest('add-sub', round, s.correct)
    enqueueSession({
      player: profile.name,
      game: 'add-sub',
      mode: timed ? 'mix+timed' : 'mix',
      pack_or_tables: String(max),
      asked: s.asked,
      correct: s.correct,
      duration_sec: durationSec,
      stars_or_score: outboxStars(s, timed),
    })
  }

  useLeaveFlush(() => {
    if (timedFlushed.current) return
    const s = scoreRef.current
    if (s.asked === 0) return
    timedFlushed.current = true
    enqueueSession({
      player: profile.name,
      game: 'add-sub',
      mode: timed ? 'mix+timed' : 'mix',
      pack_or_tables: String(max),
      asked: s.asked,
      correct: s.correct,
      duration_sec: Math.round((Date.now() - startedAt.current) / 1000),
      stars_or_score: outboxStars(s, timed),
    })
  })

  useEffect(() => {
    setLastGame('add-sub')
  }, [setLastGame])

  const pick = useCallback((prev: ArithProblem | null) => {
    setProblem(nextProblem(max, prev))
    setAnswer('')
    setFeedback(null)
  }, [max])

  useEffect(() => {
    if (!started || !timed || runDone) return
    const tick = () => {
      const rem = Math.max(0, endsAt.current - Date.now())
      setLeftMs(rem)
      if (rem <= 0) setRunDone(true)
    }
    tick()
    const id = window.setInterval(tick, 50)
    return () => window.clearInterval(id)
  }, [started, timed, runDone])

  useEffect(() => {
    if (!runDone || !timed || timedFlushed.current) return
    completeRound(score, 60)
  }, [runDone, timed, score])

  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      if (feedback || runDone) return
      if (e.key >= '0' && e.key <= '9') {
        setAnswer((v) => (v.length < 3 ? v + e.key : v))
      } else if (e.key === 'Backspace') {
        setAnswer((v) => v.slice(0, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        submitRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, feedback, runDone])

  const finishIfNeeded = (nextAsked: number, nextCorrect: number) => {
    if (sessionLength > 0 && nextAsked >= sessionLength) {
      completeRound(
        { asked: nextAsked, correct: nextCorrect },
        Math.round((Date.now() - startedAt.current) / 1000),
      )
      setRunDone(true)
    }
  }

  const submitRef = useRef(() => {})
  const submit = () => {
    if (!problem || feedback) return
    const n = Number(answer)
    if (answer === '' || Number.isNaN(n)) return
    const ok = n === problem.answer
    if (ok) {
      playCorrect(general.sound)
      setFeedback('ok')
      const next = scoreCorrect(score)
      setScore(next)
      window.setTimeout(() => {
        if (timed && leftMs <= 0) return
        finishIfNeeded(next.asked, next.correct)
        if (sessionLength > 0 && next.asked >= sessionLength) return
        pick(problem)
      }, 650)
    } else {
      playWrong(general.sound)
      setFeedback('bad')
    }
  }
  submitRef.current = submit

  const afterMissContinue = () => {
    if (!problem) return
    const next = scoreWrong(score)
    setScore(next)
    finishIfNeeded(next.asked, next.correct)
    if (sessionLength > 0 && next.asked >= sessionLength) return
    pick(problem)
  }

  const start = () => {
    startedAt.current = Date.now()
    timedFlushed.current = false
    setStarted(true)
    setRunDone(false)
    setScore(emptyScore())
    endsAt.current = Date.now() + TIMED_MS
    setLeftMs(TIMED_MS)
    pick(null)
  }

  useEffect(() => {
    start()
  }, [])

  if (!started || !problem) {
    return (
      <Shell title={t.addSub} dir="rtl">
        <p className="muted">{t.start}</p>
      </Shell>
    )
  }

  if (runDone) {
    return (
      <Shell title={t.recap} dir="rtl">
        <RecapScore score={score} round={round} previousBest={prevBestRef.current} />
        <div className="chip-row">
          <button type="button" className="tap primary" onClick={start}>
            {t.playAgain}
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={t.addSub} dir="ltr">
      <PlayScore score={score} round={round} leftMs={leftMs} />
      <p className="prompt" aria-live="polite">
        {problem.a} {problem.op} {problem.b} = ?
      </p>
      <p className="answer-box">{answer || ' '}</p>
      {feedback === 'ok' ? <AnswerMark ok /> : null}
      {feedback === 'bad' ? (
        <div>
          <AnswerMark ok={false} hint={String(problem.answer)} />
          <button type="button" className="tap primary" onClick={afterMissContinue}>
            {t.next}
          </button>
        </div>
      ) : (
        <NumberPad value={answer} onChange={setAnswer} onSubmit={submit} disabled={!!feedback} />
      )}
    </Shell>
  )
}
