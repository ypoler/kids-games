import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadState } from './shared/storage'
import { applyTheme } from './shared/theme'

applyTheme(loadState().general.theme ?? 'system')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
