import type { ReactNode } from 'react'

export function Shell({
  children,
  dir = 'rtl',
}: {
  title?: string
  children: ReactNode
  dir?: 'rtl' | 'ltr'
}) {
  return (
    <div className="shell" dir={dir}>
      <main className="main">{children}</main>
    </div>
  )
}
