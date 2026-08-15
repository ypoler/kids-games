import { useState, type FormEvent } from 'react'
import { t } from '../shared/i18n'
import { useStore } from '../shared/store'

export function NameScreen() {
  const { state, enterName, selectPlayer } = useStore()
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    enterName(name)
  }

  return (
    <div className="hub login" dir="rtl">
      <h1 className="app-title">{t.appName}</h1>
      <p className="label">{t.askName}</p>
      <form className="name-form" onSubmit={submit}>
        <input
          className="text-input"
          autoComplete="nickname"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
        />
        <button type="submit" className="tap primary" disabled={!name.trim()}>
          {t.start}
        </button>
      </form>
      {state.players.length ? (
        <>
          <p className="muted">{t.orPickSaved}</p>
          <div className="chip-row">
            {state.players.map((p) => (
              <button key={p.id} type="button" className="tap chip" onClick={() => selectPlayer(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
