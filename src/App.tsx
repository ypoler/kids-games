import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Hub } from './hub/Hub'
import { NameScreen } from './hub/NameScreen'
import { MultiplicationPage } from './games/multiplication/MultiplicationPage'
import { AddSubPage } from './games/add-sub/AddSubPage'
import { FractionsPage } from './games/fractions/FractionsPage'
import { VocabCatalogProvider } from './games/vocab/VocabCatalog'
import { VocabMatchPage, VocabMcPage } from './games/vocab/VocabPage'
import { AppChrome } from './shared/AppChrome'
import { StoreProvider, useStore } from './shared/store'
import { ThemeSync } from './shared/ThemeSync'
import type { ReactNode } from 'react'

function RequireName({ children }: { children: ReactNode }) {
  const { state } = useStore()
  if (!state.currentPlayerId) return <NameScreen />
  return <AppChrome>{children}</AppChrome>
}

export default function App() {
  return (
    <StoreProvider>
      <ThemeSync />
      <VocabCatalogProvider>
        <HashRouter>
          <RequireName>
            <Routes>
              <Route path="/" element={<Hub />} />
              <Route path="/play/multiplication" element={<MultiplicationPage />} />
              <Route path="/play/add-sub" element={<AddSubPage />} />
              <Route path="/play/fractions" element={<FractionsPage />} />
              <Route path="/play/vocab-mc" element={<VocabMcPage />} />
              <Route path="/play/vocab-match" element={<VocabMatchPage />} />
              <Route path="/play/vocab" element={<Navigate to="/play/vocab-mc" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RequireName>
        </HashRouter>
      </VocabCatalogProvider>
    </StoreProvider>
  )
}
