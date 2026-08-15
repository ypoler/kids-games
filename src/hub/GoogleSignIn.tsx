import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, renderGoogleButton } from '../shared/googleAuth'
import { t } from '../shared/i18n'

export function GoogleSignIn() {
  const btnRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !btnRef.current) return
    let cancelled = false
    const el = btnRef.current
    const width = Math.min(360, Math.floor(el.getBoundingClientRect().width) || 320)
    renderGoogleButton(el, width).catch(() => {
      if (!cancelled) setError(t.googleError)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!GOOGLE_CLIENT_ID) {
    return <p className="muted">{t.googleMissingClient}</p>
  }

  return (
    <div className="login-google">
      <div className="google-btn-host" dir="ltr" ref={btnRef} />
      {error ? <p className="bad-inline">{error}</p> : null}
    </div>
  )
}
