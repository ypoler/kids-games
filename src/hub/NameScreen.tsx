import { useState, type FormEvent } from 'react'
import { t } from '../shared/i18n'
import { Who } from '../shared/Who'
import { useStore } from '../shared/store'
import { GoogleSignIn } from './GoogleSignIn'

export function NameScreen() {
  const { state, enterName, selectPlayer } = useStore()
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    enterName(name)
  }

  return (
    <div className="hub login" dir="rtl">
      <h1 className="app-title">
        <Who name={t.appName} size="md" />
      </h1>
      <p className="login-lead">{t.loginWelcome}</p>

      <form className="name-form" onSubmit={submit}>
        <label className="field">
          {t.askName}
          <input
            className="text-input"
            autoComplete="nickname"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
          />
        </label>
        <button type="submit" className="tap primary" disabled={!name.trim()}>
          {t.loginContinue}
        </button>
      </form>

      <p className="login-or">{t.loginOr}</p>

      <GoogleSignIn />

      {state.players.length ? (
        <div className="login-saved">
          <p className="muted">{t.orPickSaved}</p>
          <div className="login-accounts">
            {state.players.map((p) => (
              <button
                key={p.id}
                type="button"
                className="tap login-account"
                onClick={() => selectPlayer(p.id)}
              >
                <Who name={p.name} picture={p.picture} size="sm" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
