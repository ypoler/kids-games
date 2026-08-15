import { useCallback, useEffect, useRef, useState } from 'react'
import { Shell } from '../../shared/Shell'
import { t } from '../../shared/i18n'
import { playCorrect, playWrong } from '../../shared/sound'
import { useActiveProfile, useStore } from '../../shared/store'
import {
  AnswerMark,
  PlayScore,
  RecapScore,
  emptyScore,
  outboxStars,
  scoreCorrect,
  scoreWrong,
  type RunScore,
} from '../../shared/score'
import { TIMED_MS } from '../../shared/TimerRing'
import { useLeaveFlush } from '../../shared/useLeaveFlush'
import { bestFor, resolvedBests } from '../../shared/types'
import { fracKey, nextProblem, type Fraction, type FractionProblem } from './engine'
import { PizzaRow } from './Pizza'

function Frac({ f }: { f: Fraction }) {
  return (
    <span className="frac" dir="ltr">
      <span>{f.n}</span>
      <span>{f.d}</span>
    </span>
  )
}

export function FractionsPage() {
  const { recordRoundBest, enqueueSession, setLastGame } = useStore()
  const { profile, progress, general, fractions } = useActiveProfile()
  const round = fractions.round
  const timed = round.type === 'timed'
  const maxD = fractions.max
  const sessionLength = round.type === 'questions' ? round.count : 0

  const [started, setStarted] = useState(false)
  const [problem, setProblem] = useState<FractionProblem | null>(null)
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
    prevBestRef.current = bestFor(resolvedBests(progress, 'fractions'), round)
    recordRoundBest('fractions', round, s.correct)
    enqueueSession({
      player: profile.name,
      game: 'fractions',
      mode: timed ? 'identify+timed' : 'identify',
      pack_or_tables: String(maxD),
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
      game: 'fractions',
      mode: timed ? 'identify+timed' : 'identify',
      pack_or_tables: String(maxD),
      asked: s.asked,
      correct: s.correct,
      duration_sec: Math.round((Date.now() - startedAt.current) / 1000),
      stars_or_score: outboxStars(s, timed),
    })
  })

  useEffect(() => {
    setLastGame('fractions')
  }, [setLastGame])

  const pick = useCallback(
    (prev: Fraction | null) => {
      setProblem(nextProblem(maxD, prev))
      setFeedback(null)
    },
    [maxD],
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

  const finishIfNeeded = (nextAsked: number, nextCorrect: number) => {
    if (sessionLength > 0 && nextAsked >= sessionLength) {
      completeRound(
        { asked: nextAsked, correct: nextCorrect },
        Math.round((Date.now() - startedAt.current) / 1000),
      )
      setRunDone(true)
    }
  }

  const onPick = (choice: Fraction) => {
    if (!problem || feedback) return
    const ok = fracKey(choice) === fracKey(problem)
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
      <Shell title={t.fractions} dir="rtl">
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
    <Shell title={t.fractions} dir="rtl">
      <PlayScore score={score} round={round} leftMs={leftMs} />
      <p className="frac-prompt">{t.fracPrompt}</p>
      <div className="pizza-wrap">
        <PizzaRow n={problem.n} d={problem.d} />
      </div>
      {feedback === 'ok' ? <AnswerMark ok /> : null}
      {feedback === 'bad' ? (
        <div>
          <AnswerMark ok={false} />
          <p className="answer-mark-hint">
            <Frac f={problem} />
          </p>
          <button type="button" className="tap primary" onClick={afterMissContinue}>
            {t.next}
          </button>
        </div>
      ) : (
        <div className="frac-choices">
          {problem.choices.map((c) => (
            <button
              key={fracKey(c)}
              type="button"
              className="tap choice frac-choice"
              disabled={!!feedback}
              onClick={() => onPick(c)}
            >
              <Frac f={c} />
            </button>
          ))}
        </div>
      )}
    </Shell>
  )
}
