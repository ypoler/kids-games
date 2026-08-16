import { useMemo } from 'react'
import { t } from './i18n'

const ANIMALS = ['🐼', '🦊', '🐸', '🐧', '🐵', '🦁', '🐯', '🐰', '🐷', '🦄', '🐙', '🦉', '🦆', '🐨', '🦒']

function pickCrew(seed: number, n: number) {
  const pool = ANIMALS.slice()
  const out: string[] = []
  let x = seed || 1
  while (out.length < n && pool.length) {
    x = (x * 16807) % 2147483647
    const i = x % pool.length
    out.push(pool.splice(i, 1)[0]!)
  }
  return out
}

export function isGoodRound(asked: number, correct: number) {
  return asked > 0 && correct / asked >= 0.7
}

export function DanceFloor({ asked, correct }: { asked: number; correct: number }) {
  const crew = useMemo(() => pickCrew(correct * 17 + asked * 31 + 3, 5), [asked, correct])
  if (!isGoodRound(asked, correct)) return null
  return (
    <div className="dance-floor" role="img" aria-label={t.danceParty}>
      <p className="dance-cheer">{t.greatScore}</p>
      <div className="dancers">
        {crew.map((animal, i) => (
          <span key={`${animal}-${i}`} className={`dancer dancer-${i % 5}`} aria-hidden="true">
            {animal}
          </span>
        ))}
      </div>
    </div>
  )
}
