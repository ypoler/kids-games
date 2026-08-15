import { useEffect } from 'react'
import { applyTheme } from './theme'
import { useStore } from './store'

export function ThemeSync() {
  const theme = useStore().state.general.theme ?? 'system'
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
  return null
}
