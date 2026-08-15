import { useCallback, useEffect, useRef, useState } from 'react'
import { Shell } from '../../shared/Shell'
import { t } from '../../shared/i18n'
import { playCorrect, playWrong } from '../../shared/sound'
import { useActiveProfile, useStore } from '../../shared/store'
import { AnswerMark, PlayScore, RecapScore, emptyScore, outboxStars, scoreCorrect, scoreWrong, type RunScore } from '../../shared/score'
import { TIMED_MS } from '../../shared/TimerRing'
import { useLeaveFlush } from '../../shared/useLeaveFlush'
import { bestFor, resolvedBests } from '../../shared/types'
import {
  factKey,
  nextFact,
  type Fact,
} from './engine'

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

export function MultiplicationPage() {
  const { recordFact, recordRoundBest, enqueueSession, setLastGame } = useStore()
  const { profile, progress, general, multiplication } = useActiveProfile()
  const round = multiplication.round
  const timed = round.type === 'timed'
  const missing = multiplication.missing
  const tablesForNext = multiplication.tables.length ? multiplication.tables : [2, 3, 4, 5]
  const sessionLength = round.type === 'questions' ? round.count : 0
  const modeLabel = missing ? 'missing' : 'mix'

  const [started, setStarted] = useState(false)
  const [fact, setFact] = useState<Fact | null>(null)
  const [missingSlot, setMissingSlot] = useState<'a' | 'b' | 'p'>('p')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [retrySame, setRetrySame] = useState(false)
  const [score, setScore] = useState<RunScore>(emptyScore)
  const [runDone, setRunDone] = useState(false)
  const consecOk = useRef(0)
  const consecBad = useRef(0)
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
    prevBestRef.current = bestFor(resolvedBests(progress, 'multiplication'), round)
    recordRoundBest('multiplication', round, s.correct)
    enqueueSession({
      player: profile.name,
      game: 'multiplication',
      mode: timed ? `${modeLabel}+timed` : modeLabel,
      pack_or_tables: tablesForNext.join(','),
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
      game: 'multiplication',
      mode: timed ? `${modeLabel}+timed` : modeLabel,
      pack_or_tables: tablesForNext.join(','),
      asked: s.asked,
      correct: s.correct,
      duration_sec: Math.round((Date.now() - startedAt.current) / 1000),
      stars_or_score: outboxStars(s, timed),
    })
  })

  useEffect(() => {
    setLastGame('multiplication')
  }, [setLastGame])

  const pick = useCallback(
    (okStreak: number, badStreak: number) => {
      const f = nextFact(tablesForNext, progress.multiplication.facts, okStreak, badStreak)
      setFact(f)
      setMissingSlot(missing ? (['a', 'b', 'p'] as const)[Math.floor(Math.random() * 3)]! : 'p')
      setAnswer('')
      setFeedback(null)
      setRetrySame(false)
    },
    [missing, progress.multiplication.facts, tablesForNext],
  )

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

  const expected = fact
    ? missingSlot === 'a'
      ? fact.a
      : missingSlot === 'b'
        ? fact.b
        : fact.product
    : 0

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
    if (!fact || feedback) return
    const n = Number(answer)
    if (answer === '' || Number.isNaN(n)) return
    const key = factKey(fact.a, fact.b)
    const ok = n === expected
    recordFact(key, ok)
    if (ok) {
      playCorrect(general.sound)
      setFeedback('ok')
      const next = scoreCorrect(score)
      setScore(next)
      consecOk.current += 1
      consecBad.current = 0
      window.setTimeout(() => {
        if (timed && leftMs <= 0) return
        finishIfNeeded(next.asked, next.correct)
        if (sessionLength > 0 && next.asked >= sessionLength) return
        pick(consecOk.current, 0)
      }, 650)
    } else {
      playWrong(general.sound)
      setFeedback('bad')
      consecOk.current = 0
      consecBad.current += 1
      setRetrySame(true)
    }
  }
  submitRef.current = submit

  const afterMissContinue = () => {
    if (!fact) return
    const next = scoreWrong(score)
    setScore(next)
    finishIfNeeded(next.asked, next.correct)
    if (sessionLength > 0 && next.asked >= sessionLength) return
    if (retrySame) {
      setAnswer('')
      setFeedback(null)
      setRetrySame(false)
      return
    }
    pick(0, consecBad.current)
  }

  const start = () => {
    startedAt.current = Date.now()
    timedFlushed.current = false
    setStarted(true)
    setRunDone(false)
    setScore(emptyScore())
    consecOk.current = 0
    consecBad.current = 0
    endsAt.current = Date.now() + TIMED_MS
    setLeftMs(TIMED_MS)
    pick(0, 0)
  }

  useEffect(() => {
    start()
  }, [])

  const prompt = () => {
    if (!fact) return ''
    if (missingSlot === 'a') return `? × ${fact.b} = ${fact.product}`
    if (missingSlot === 'b') return `${fact.a} × ? = ${fact.product}`
    return `${fact.a} × ${fact.b} = ?`
  }

  if (!started || !fact) {
    return (
      <Shell title={t.multiply} dir="rtl">
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
    <Shell title={t.multiply} dir="ltr">
      <PlayScore score={score} round={round} leftMs={leftMs} />
      <p className="prompt" aria-live="polite">
        {prompt()}
      </p>
      <p className="answer-box">{answer || ' '}</p>
      {feedback === 'ok' ? <AnswerMark ok /> : null}
      {feedback === 'bad' ? (
        <div>
          <AnswerMark ok={false} hint={String(expected)} />
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
