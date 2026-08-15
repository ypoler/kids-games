import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SettingsSheet } from '../hub/ParentCorner'
import { t } from './i18n'
import { IconClose, IconCog, IconMenu } from './Icons'
import { Who } from './Who'
import { useActiveProfile, useStore } from './store'
import type { ReactNode } from 'react'

export function AppChrome({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false)
  const [settings, setSettings] = useState(false)
  const { clearCurrent } = useStore()
  const { profile } = useActiveProfile()
  const loc = useLocation()
  const nav = useNavigate()
  const atHome = loc.pathname === '/'
  const title = loc.pathname.includes('multiplication')
    ? t.multiply
    : loc.pathname.includes('add-sub')
      ? t.addSub
      : loc.pathname.includes('fractions')
        ? t.fractions
        : loc.pathname.includes('vocab-match')
        ? t.vocabMatch
        : loc.pathname.includes('vocab')
          ? t.vocabMc
          : t.appName

  return (
    <div className="app-root" dir="rtl">
      <header className="app-bar">
        <button
          type="button"
          className="icon-btn"
          aria-label={t.menu}
          onClick={() => setMenu(true)}
        >
          <IconMenu />
        </button>
        <div className="app-bar-title">
          <strong>{title}</strong>
          <span className="app-bar-who">
            <Who name={profile.name} picture={profile.picture} size="sm" />
          </span>
        </div>
        {atHome ? (
          <span className="app-bar-slot" aria-hidden="true" />
        ) : (
          <button
            type="button"
            className="icon-btn"
            aria-label={t.close}
            onClick={() => nav('/')}
          >
            <IconClose />
          </button>
        )}
      </header>

      <div className="app-body">{children}</div>

      {menu ? (
        <div className="drawer-root">
          <button type="button" className="drawer-backdrop" aria-label={t.close} onClick={() => setMenu(false)} />
          <nav className="drawer" dir="rtl">
            <p className="drawer-name">
              <Who name={profile.name} picture={profile.picture} size="md" />
            </p>
            <button
              type="button"
              className="tap drawer-item"
              onClick={() => {
                setMenu(false)
                setSettings(true)
              }}
            >
              <IconCog />
              {t.settings}
            </button>
            <button
              type="button"
              className="tap drawer-item"
              onClick={() => {
                setMenu(false)
                nav('/')
                clearCurrent()
              }}
            >
              {t.notMe}
            </button>
          </nav>
        </div>
      ) : null}

      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
