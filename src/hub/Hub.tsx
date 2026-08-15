import { Link } from 'react-router-dom'
import { t } from '../shared/i18n'
import { Who } from '../shared/Who'
import { useActiveProfile } from '../shared/store'

function lastLabel(last: string) {
  if (last === 'multiplication') return t.multiply
  if (last === 'add-sub') return t.addSub
  if (last === 'vocab-match') return t.vocabMatch
  return t.vocabMc
}

export function Hub() {
  const { profile, progress } = useActiveProfile()
  const last = progress.lastGame
  const lastHref =
    last === 'multiplication'
      ? '/play/multiplication'
      : last === 'add-sub'
        ? '/play/add-sub'
        : last === 'vocab-match'
          ? '/play/vocab-match'
          : last
            ? '/play/vocab-mc'
            : null

  return (
    <div className="hub" dir="rtl">
      <p className="hello">{t.hello}</p>
      <h1 className="app-title tight">
        <Who name={profile.name} picture={profile.picture} size="md" />
      </h1>

      {last && lastHref ? (
        <p className="muted">
          {t.resume}: {lastLabel(last)}
        </p>
      ) : null}

      <div className="tiles">
        <Link className="tile tap" to="/play/multiplication">
          <span className="tile-emoji" aria-hidden="true">
            ✖️
          </span>
          <span className="tile-copy">
            <strong>{t.multiply}</strong>
            <span>{t.multiplyHint}</span>
          </span>
        </Link>
        <Link className="tile tap" to="/play/add-sub">
          <span className="tile-emoji" aria-hidden="true">
            ➕
          </span>
          <span className="tile-copy">
            <strong>{t.addSub}</strong>
            <span>{t.addSubHint}</span>
          </span>
        </Link>
        <Link className="tile tap" to="/play/vocab-mc">
          <span className="tile-emoji" aria-hidden="true">
            🔤
          </span>
          <span className="tile-copy">
            <strong>{t.vocabMc}</strong>
            <span>{t.vocabMcHint}</span>
          </span>
        </Link>
        <Link className="tile tap" to="/play/vocab-match">
          <span className="tile-emoji" aria-hidden="true">
            🧩
          </span>
          <span className="tile-copy">
            <strong>{t.vocabMatch}</strong>
            <span>{t.vocabMatchHint}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
