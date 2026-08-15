import { useEffect, useMemo, useRef, useState } from 'react'
import { Shell } from '../../shared/Shell'
import { t } from '../../shared/i18n'
import { playCorrect, playWrong, speakEnglish, stopSpeak } from '../../shared/sound'
import { SpeakWord } from '../../shared/SpeakWord'
import { useActiveProfile, useStore } from '../../shared/store'
import { AnswerMark, PlayScore, RecapScore, emptyScore, outboxStars, scoreCorrect, scoreWrong, type RunScore } from '../../shared/score'
import { TIMED_MS } from '../../shared/TimerRing'
import { useLeaveFlush } from '../../shared/useLeaveFlush'
import { bestFor, filterPacks, resolvedBests } from '../../shared/types'
import { useVocabCatalog } from './VocabCatalog'
import {
  choices,
  matchPairs,
  matchBoardSize,
  nextWord,
  shuffle,
  type VocabWord,
} from './engine'

export function VocabMcPage() {
  return <VocabGame kind="mc" />
}

export function VocabMatchPage() {
  return <VocabGame kind="match" />
}

function VocabGame({ kind }: { kind: 'mc' | 'match' }) {
  const { recordWord, recordRoundBest, enqueueSession, setLastGame } = useStore()
  const { profile, progress, general, vocabMc, vocabMatch } = useActiveProfile()
  const { packs, ready } = useVocabCatalog()
  const settings = kind === 'mc' ? vocabMc : vocabMatch
  const round = settings.round
  const timed = round.type === 'timed'
  const reverse = kind === 'mc' && vocabMc.heToEn
  const title = kind === 'mc' ? t.vocabMc : t.vocabMatch
  const gameId = kind === 'mc' ? 'vocab-mc' : 'vocab-match'
  const sessionLength = round.type === 'questions' ? round.count : 0
  const visible = filterPacks(packs, settings.packIds)
  const words = visible.flatMap((p) => p.words)
  const packLabel = visible.map((p) => p.id).join(',')

  const [started, setStarted] = useState(false)
  const [word, setWord] = useState<VocabWord | null>(null)
  const [opts, setOpts] = useState<string[]>([])
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [score, setScore] = useState<RunScore>(emptyScore)
  const [runDone, setRunDone] = useState(false)
  const [pairs, setPairs] = useState<VocabWord[]>([])
  const [picked, setPicked] = useState<{ side: 'en' | 'he'; id: string } | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [leftMs, setLeftMs] = useState(TIMED_MS)
  const startedAt = useRef(Date.now())
  const endsAt = useRef(0)
  const timedFlushed = useRef(false)
  const prevBestRef = useRef(0)
  const scoreRef = useRef(score)
  scoreRef.current = score

  const packWords = words
  const modeLabel = kind === 'match' ? 'match' : reverse ? 'he-en' : 'en-he'

  useEffect(() => {
    setLastGame(gameId)
  }, [gameId, setLastGame])

  useEffect(() => () => stopSpeak(), [])

  useEffect(() => {
    if (kind !== 'mc' || reverse || !word?.en || !started || runDone) return
    speakEnglish(word.en, general.sound)
  }, [kind, reverse, word?.id, word?.en, started, runDone, general.sound])

  const promptText = (w: VocabWord) => (reverse ? w.he : w.en)
  const answerText = (w: VocabWord) => (reverse ? w.en : w.he)

  const loadMc = (pool: VocabWord[]) => {
    const w = nextWord(pool, progress.vocab.words)
    setWord(w)
    setOpts(choices(w, pool, reverse))
    setFeedback(null)
  }

  const start = () => {
    startedAt.current = Date.now()
    timedFlushed.current = false
    endsAt.current = Date.now() + TIMED_MS
    setLeftMs(TIMED_MS)
    setStarted(true)
    setRunDone(false)
    setScore(emptyScore())
    setMatched([])
    setPicked(null)
    if (kind === 'match') {
      setPairs(matchPairs(packWords, matchBoardSize(round, 0)))
    } else {
      loadMc(packWords)
    }
  }

  useEffect(() => {
    if (!ready || !packWords.length) return
    start()
  }, [ready])

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

  const flush = (nextAsked: number, nextCorrect: number, durationSec: number) => {
    if (timedFlushed.current) return
    timedFlushed.current = true
    enqueueSession({
      player: profile.name,
      game: gameId,
      mode: timed ? `${modeLabel}+timed` : modeLabel,
      pack_or_tables: packLabel,
      asked: nextAsked,
      correct: nextCorrect,
      duration_sec: durationSec,
      stars_or_score: outboxStars({ asked: nextAsked, correct: nextCorrect }, timed),
    })
  }

  const completeRound = (nextAsked: number, nextCorrect: number, durationSec: number) => {
    if (timedFlushed.current) return
    prevBestRef.current = bestFor(resolvedBests(progress, gameId), round)
    recordRoundBest(gameId, round, nextCorrect)
    flush(nextAsked, nextCorrect, durationSec)
  }

  useLeaveFlush(() => {
    const s = scoreRef.current
    if (s.asked === 0) return
    flush(s.asked, s.correct, Math.round((Date.now() - startedAt.current) / 1000))
  })

  useEffect(() => {
    if (!runDone || !timed || timedFlushed.current) return
    completeRound(score.asked, score.correct, 60)
  }, [runDone, timed, score])

  const maybeFinish = (nextAsked: number, nextCorrect: number) => {
    const limit = sessionLength
    if (limit > 0 && nextAsked >= limit) {
      setRunDone(true)
      completeRound(nextAsked, nextCorrect, Math.round((Date.now() - startedAt.current) / 1000))
    }
  }

  const onMc = (choice: string) => {
    if (!word || feedback) return
    const ok = choice === answerText(word)
    recordWord(word.id, ok)
    if (ok) {
      playCorrect(general.sound)
      setFeedback('ok')
      const next = scoreCorrect(score)
      setScore(next)
      window.setTimeout(() => {
        if (timed && endsAt.current - Date.now() <= 0) return
        maybeFinish(next.asked, next.correct)
        if (sessionLength > 0 && next.asked >= sessionLength) return
        loadMc(packWords)
      }, 700)
    } else {
      playWrong(general.sound)
      setFeedback('bad')
    }
  }

  const afterBad = () => {
    if (!word) return
    const next = scoreWrong(score)
    setScore(next)
    maybeFinish(next.asked, next.correct)
    if (sessionLength > 0 && next.asked >= sessionLength) return
    loadMc(packWords)
  }

  const enOrder = useMemo(() => shuffle(pairs), [pairs])
  const heOrder = useMemo(() => shuffle(pairs), [pairs])

  const onMatchTap = (side: 'en' | 'he', id: string) => {
    if (runDone || matched.includes(id)) return
    if (side === 'en') {
      const w = pairs.find((p) => p.id === id)
      if (w) speakEnglish(w.en, general.sound)
    }
    if (!picked || picked.side === side) {
      setPicked(picked?.side === side && picked.id === id ? null : { side, id })
      return
    }
    const ok = picked.id === id
    recordWord(id, ok)
    if (ok) {
      playCorrect(general.sound)
      const next = [...matched, id]
      setMatched(next)
      setPicked(null)
      const nextScore = scoreCorrect(score)
      setScore(nextScore)
      const boardDone = next.length === pairs.length
      const hitLimit = sessionLength > 0 && nextScore.asked >= sessionLength
      if (hitLimit) {
        setRunDone(true)
        completeRound(nextScore.asked, nextScore.correct, Math.round((Date.now() - startedAt.current) / 1000))
        return
      }
      if (boardDone) {
        setPairs(matchPairs(packWords, matchBoardSize(round, nextScore.asked)))
        setMatched([])
        setPicked(null)
      }
    } else {
      playWrong(general.sound)
      setPicked(null)
      const nextScore = scoreWrong(score)
      setScore(nextScore)
      maybeFinish(nextScore.asked, nextScore.correct)
    }
  }

  if (!ready) {
    return (
      <Shell title={title} dir="rtl">
        <p className="muted">{t.packsLoading}</p>
      </Shell>
    )
  }

  if (!packWords.length) {
    return (
      <Shell title={title} dir="rtl">
        <p className="muted">{t.packPickInSettings}</p>
      </Shell>
    )
  }

  if (!started) {
    return (
      <Shell title={title} dir="rtl">
        <p className="muted">{t.start}</p>
      </Shell>
    )
  }

  if (runDone) {
    return (
      <Shell title={t.recap} dir="rtl">
        <RecapScore score={score} round={round} previousBest={prevBestRef.current} />
        <button type="button" className="tap primary" onClick={start}>
          {t.playAgain}
        </button>
      </Shell>
    )
  }

  const hud = (
    <PlayScore
      score={kind === 'match' ? { asked: pairs.length, correct: matched.length } : score}
      round={round}
      leftMs={leftMs}
      total={kind === 'match' ? pairs.length : undefined}
    />
  )

  if (kind === 'match') {
    return (
      <Shell title={title} dir="rtl">
        {hud}
        <div className="match-board">
          <div className="match-col" dir="ltr">
            {enOrder.map((w) => (
              <div key={w.id} className="match-en-row">
                <button
                  type="button"
                  className={
                    matched.includes(w.id)
                      ? 'tap match-item done'
                      : picked?.side === 'en' && picked.id === w.id
                        ? 'tap match-item on'
                        : 'tap match-item'
                  }
                  disabled={matched.includes(w.id)}
                  onClick={() => onMatchTap('en', w.id)}
                >
                  {w.en}
                </button>
                <SpeakWord text={w.en} />
              </div>
            ))}
          </div>
          <div className="match-col">
            {heOrder.map((w) => (
              <button
                key={w.id}
                type="button"
                className={
                  matched.includes(w.id)
                    ? 'tap match-item done'
                    : picked?.side === 'he' && picked.id === w.id
                      ? 'tap match-item on'
                      : 'tap match-item'
                }
                disabled={matched.includes(w.id)}
                onClick={() => onMatchTap('he', w.id)}
              >
                {w.he}
              </button>
            ))}
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={title} dir="rtl">
      {hud}
      <div className="prompt-with-speak">
        <p className="prompt" dir={reverse ? 'rtl' : 'ltr'}>
          {word ? promptText(word) : ''}
        </p>
        {word && !reverse ? <SpeakWord text={word.en} /> : null}
      </div>
      {word?.transliteration && reverse ? (
        <p className="muted" dir="ltr">
          {word.transliteration}
        </p>
      ) : null}
      <div className="choice-col">
        {opts.map((o) =>
          reverse ? (
            <div key={o} className="choice-with-speak">
              <button
                type="button"
                className="tap choice"
                disabled={!!feedback}
                onClick={() => onMc(o)}
              >
                {o}
              </button>
              <SpeakWord text={o} />
            </div>
          ) : (
            <button
              key={o}
              type="button"
              className="tap choice"
              disabled={!!feedback}
              onClick={() => onMc(o)}
            >
              {o}
            </button>
          ),
        )}
      </div>
      {feedback === 'ok' ? <AnswerMark ok /> : null}
      {feedback === 'bad' && word ? (
        <div>
          <AnswerMark ok={false} hint={answerText(word)} />
          <button type="button" className="tap primary" onClick={afterBad}>
            {t.next}
          </button>
        </div>
      ) : null}
    </Shell>
  )
}
