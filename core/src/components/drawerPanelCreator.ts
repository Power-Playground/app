import type { ReactNode } from 'react'
import { useCallback, useMemo, useRef } from 'react'
import { atom, useAtom, useStore } from 'jotai'

export interface DrawerPanelProps {
  Template(props: {
    name: 'title' | 'actions'
    children: ReactNode
  }): ReactNode
}

export interface DrawerPanel {
  id: string
  icon?: string | ReactNode
  title: string | ReactNode
  actions?: ReactNode
  content?: ReactNode
  (props: DrawerPanelProps): ReactNode
}

export interface DrawerPanelController {
  activePanel: DrawerPanel | null
  addPanel(panel: DrawerPanel): void
  setPanel(panel: DrawerPanel): void
  removePanel(id: string): void
  openPanel(id: string): void
  closePanel(id: string): void
  togglePanel(id: string): void
}

const drawerPanelsAtom = atom<DrawerPanel[]>([])
const activeDrawerPanelIdAtom = atom<string | null>(null)

function useRefCallback<T extends (...args: any[]) => any>(fn: T) {
  const ref = useRef<T>(fn)
  ref.current = fn
  return useCallback((...args: Parameters<T>) => ref.current(...args), [])
}

export const useDrawerPanelController = (): DrawerPanelController => {
  const store = useStore()
  const [panels, setPanels] = useAtom(drawerPanelsAtom, { store })
  const [activePanelId, setActivePanelId] = useAtom(activeDrawerPanelIdAtom, { store })
  const activePanel = useMemo(() => panels.find(panel => panel.id === activePanelId) ?? null, [panels, activePanelId])
  const setPanelsRef = useRefCallback(setPanels)
  return {
    activePanel,
    addPanel: useCallback(panel => {
      setPanelsRef(panels => {
        if (panels.some(p => p.id === panel.id)) {
          console.warn(`Panel with id "${panel.id}" already exists.`)
          return panels
        }
        return [...panels, panel]
      })
    }, [setPanelsRef]),
    setPanel: useCallback(panel => {
      setPanelsRef(panels => {
        const index = panels.findIndex(p => p.id === panel.id)
        if (index === -1) {
          return panels.concat(panel)
        }
        panels[index] = panel
        return [...panels]
      })
    }, [setPanelsRef]),
    removePanel: useCallback(id => {
      setPanelsRef(panels => panels.filter(panel => panel.id !== id))
    }, [setPanelsRef]),
    openPanel: useCallback(id => setActivePanelId(id), [setActivePanelId]),
    closePanel: useCallback(id => {
      setActivePanelId(activePanelId => activePanelId === id ? null : activePanelId)
    }, [setActivePanelId]),
    togglePanel: useCallback(id => {
      setActivePanelId(activePanelId => activePanelId === id ? null : id)
    }, [setActivePanelId])
  }
}
