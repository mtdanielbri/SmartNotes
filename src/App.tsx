import { lazy, Suspense, useEffect } from 'react'
import { BoardView } from './components/board/BoardView'
import { ShortcutsDialog } from './components/dialogs/ShortcutsDialog'
import { TagManager } from './components/dialogs/TagManager'
import { TopBar } from './components/topbar/TopBar'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { Toaster } from './components/ui/Toaster'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useThemeEffect } from './hooks/useTheme'
import { syncAcrossTabs } from './store/useBoardStore'
import { useUiStore } from './store/useUiStore'
import './App.css'

// The rich text editor is the heaviest part of the app: load it on first use.
const CardEditor = lazy(() => import('./components/editor/CardEditor').then((m) => ({ default: m.CardEditor })))

export default function App() {
  useThemeEffect()
  useGlobalShortcuts()
  useEffect(() => syncAcrossTabs(), [])
  const editingCardId = useUiStore((s) => s.editingCardId)
  const dialog = useUiStore((s) => s.dialog)

  return (
    <div className="app">
      <TopBar />
      <main className="app__main">
        <BoardView />
      </main>
      {editingCardId && (
        <Suspense fallback={null}>
          <CardEditor key={editingCardId} cardId={editingCardId} />
        </Suspense>
      )}
      {dialog === 'tags' && <TagManager />}
      {dialog === 'shortcuts' && <ShortcutsDialog />}
      <ConfirmDialog />
      <Toaster />
    </div>
  )
}
