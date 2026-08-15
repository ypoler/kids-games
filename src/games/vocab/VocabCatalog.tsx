import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { VocabPack } from './engine'
import { bundledPacks, fetchVocabPacks, initialPacks, readCachedPacks } from './sheet'

type Catalog = {
  packs: VocabPack[]
  ready: boolean
  source: 'sheet' | 'cache' | 'bundled'
}

const VocabCatalogContext = createContext<Catalog>({
  packs: bundledPacks,
  ready: false,
  source: 'bundled',
})

export function VocabCatalogProvider({ children }: { children: ReactNode }) {
  const [packs, setPacks] = useState(initialPacks)
  const [ready, setReady] = useState(false)
  const [source, setSource] = useState<Catalog['source']>(() =>
    readCachedPacks() ? 'cache' : 'bundled',
  )

  useEffect(() => {
    const ac = new AbortController()
    const timer = window.setTimeout(() => ac.abort(), 8000)
    fetchVocabPacks(ac.signal)
      .then((next) => {
        setPacks(next)
        setSource('sheet')
      })
      .catch(() => {
        setPacks((prev) => (prev.length ? prev : bundledPacks))
      })
      .finally(() => {
        window.clearTimeout(timer)
        setReady(true)
      })
    return () => {
      window.clearTimeout(timer)
      ac.abort()
    }
  }, [])

  const value = useMemo(() => ({ packs, ready, source }), [packs, ready, source])
  return <VocabCatalogContext.Provider value={value}>{children}</VocabCatalogContext.Provider>
}

export function useVocabCatalog() {
  return useContext(VocabCatalogContext)
}
