import { t } from './i18n'
import { TIMED_MS, TimerRing, starsForTimed } from './TimerRing'
import type { RoundGoal } from './types'

export type RunScore = {
  asked: number
  correct: number
}

export function emptyScore(): RunScore {
  return { asked: 0, correct: 0 }
}

export function scoreCorrect(s: RunScore): RunScore {
  return { asked: s.asked + 1, correct: s.correct + 1 }
}

export function scoreWrong(s: RunScore): RunScore {
  return { asked: s.asked + 1, correct: s.correct }
}

export function outboxStars(score: RunScore, timed: boolean) {
  return timed ? starsForTimed(score.asked, score.correct) : score.correct
}

export function PlayScore({
  score,
  round,
  leftMs,
  total,
}: {
  score: RunScore
  round: RoundGoal
  leftMs: number
  total?: number
}) {
  const timed = round.type === 'timed'
  const denom = total ?? (timed ? score.asked : round.count)
  return (
    <div className="play-status">
      {timed ? <TimerRing leftMs={leftMs} totalMs={TIMED_MS} /> : null}
      <p className="score-now" dir="ltr">
        {score.correct} / {denom}
      </p>
    </div>
  )
}

export function AnswerMark({ ok, hint }: { ok: boolean; hint?: string }) {
  return (
    <div className={ok ? 'answer-mark ok' : 'answer-mark bad'} role="status">
      <span className="answer-mark-emoji" aria-hidden="true">
        {ok ? '✔' : '✘'}
      </span>
      {!ok && hint ? <p className="answer-mark-hint">{hint}</p> : null}
    </div>
  )
}

export function RecapScore({
  score,
  round,
  previousBest,
}: {
  score: RunScore
  round: RoundGoal
  previousBest: number
}) {
  const isNew = score.correct > previousBest
  const bestNow = Math.max(previousBest, score.correct)
  const fmt = (n: number) =>
    round.type === 'timed' ? `${n} / ${score.asked}` : `${n} / ${round.count}`
  return (
    <div className="scoreboard">
      {isNew ? <p className="scoreboard-new">{t.newBest}</p> : null}
      <div className="scoreboard-row this">
        <span>{t.thisRound}</span>
        <strong dir="ltr">{fmt(score.correct)}</strong>
      </div>
      <div className="scoreboard-row">
        <span>{t.yourBest}</span>
        <strong dir="ltr">{fmt(bestNow)}</strong>
      </div>
    </div>
  )
}
