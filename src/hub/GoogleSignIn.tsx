import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, renderGoogleButton } from '../shared/googleAuth'
import { t } from '../shared/i18n'

export function GoogleSignIn() {
  const btnRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !btnRef.current) return
    let cancelled = false
    renderGoogleButton(btnRef.current).catch(() => {
      if (!cancelled) setError(t.googleError)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="parent-google">
      <p className="label">{t.googleTitle}</p>
      <p className="muted">{t.googleHint}</p>
      {!GOOGLE_CLIENT_ID ? <p className="muted">{t.googleMissingClient}</p> : null}
      {GOOGLE_CLIENT_ID ? <div className="google-btn-host" dir="ltr" ref={btnRef} /> : null}
      {error ? <p className="bad-inline">{error}</p> : null}
    </section>
  )
}
