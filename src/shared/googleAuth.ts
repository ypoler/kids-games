export type GoogleIdentity = {
  sub: string
  email: string
  name: string
  picture?: string
}

const STORAGE_KEY = 'kids-games-parent-v1'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

type CredentialResponse = { credential?: string }

type GoogleId = {
  initialize: (cfg: {
    client_id: string
    callback: (res: CredentialResponse) => void
    auto_select?: boolean
    ux_mode?: 'popup' | 'redirect'
    context?: 'signin' | 'signup' | 'use'
    itp_support?: boolean
  }) => void
  renderButton: (
    el: HTMLElement,
    opts: {
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      locale?: string
      width?: number
    },
  ) => void
  disableAutoSelect: () => void
  revoke: (hint: string, done: () => void) => void
  cancel?: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

export function readCachedGoogleIdentity(): GoogleIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GoogleIdentity
    if (!parsed.sub || !parsed.email) return null
    return parsed
  } catch {
    return null
  }
}

export function writeCachedGoogleIdentity(identity: GoogleIdentity | null) {
  if (!identity) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
}

export function identityFromJwt(credential: string): GoogleIdentity {
  const part = credential.split('.')[1]
  if (!part) throw new Error('bad jwt')
  const json = JSON.parse(utf8Base64UrlDecode(part)) as {
    sub?: string
    email?: string
    name?: string
    picture?: string
  }
  if (!json.sub || !json.email) throw new Error('jwt missing email')
  return {
    sub: json.sub,
    email: json.email,
    name: json.name || json.email,
    picture: json.picture,
  }
}

function utf8Base64UrlDecode(part: string): string {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const bin = atob(b64 + pad)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function loadGis(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    const onReady = () => {
      const id = window.google?.accounts?.id
      if (id) resolve(id)
      else reject(new Error('gis missing'))
    }
    if (existing) {
      existing.addEventListener('load', onReady)
      existing.addEventListener('error', () => reject(new Error('gis load')))
      if (window.google?.accounts?.id) onReady()
      return
    }
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = onReady
    s.onerror = () => reject(new Error('gis load'))
    document.head.appendChild(s)
  })
}

let gisInited = false
let signInHandler: ((identity: GoogleIdentity) => void) | null = null

export function setGoogleSignInHandler(cb: (identity: GoogleIdentity) => void) {
  signInHandler = cb
  return () => {
    if (signInHandler === cb) signInHandler = null
  }
}

function finishSignIn(identity: GoogleIdentity) {
  writeCachedGoogleIdentity(identity)
  signInHandler?.(identity)
  loadGis()
    .then((id) => {
      try {
        id.cancel?.()
      } catch {
        /* older GIS */
      }
    })
    .catch(() => {})
}

export async function ensureGisInitialized(): Promise<GoogleId> {
  const id = await loadGis()
  if (!GOOGLE_CLIENT_ID) throw new Error('no client id')
  if (!gisInited) {
    id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res) => {
        try {
          if (!res.credential) throw new Error('no credential')
          finishSignIn(identityFromJwt(res.credential))
        } catch {
          /* button UI shows load errors */
        }
      },
      auto_select: false,
      ux_mode: 'popup',
      context: 'signin',
      itp_support: true,
    })
    gisInited = true
  }
  return id
}

export async function renderGoogleButton(el: HTMLElement, width = 320) {
  const id = await ensureGisInitialized()
  el.replaceChildren()
  id.renderButton(el, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    locale: 'he',
    width,
    shape: 'rectangular',
  })
}

export async function signOutGoogle(email?: string) {
  writeCachedGoogleIdentity(null)
  if (!email) return
  const id = await loadGis()
  id.disableAutoSelect()
  id.revoke(email, () => {})
}
