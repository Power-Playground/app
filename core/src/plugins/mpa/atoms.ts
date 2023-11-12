import { useCallback } from 'react'
import { atom, useAtom, useStore } from 'jotai'

interface Tab {
  id: string
  icon?: string
  title: string
  closeable?: boolean
  active?: boolean
}

export const tabsAtom = atom<Tab[]>([])

export const useTabs = () => {
  const [tabs, setTabs] = useAtom(tabsAtom, { store: useStore() })
  return {
    tabs,
    setActiveTab: useCallback((id: string) => {
      setTabs(tabs => tabs.map(tab => ({ ...tab, active: tab.id === id })))
    }, [setTabs]),
    addTab: useCallback((tab: Tab, options?: {
    } & (
      | {
        beforeActive?: boolean
      }
      | {
        afterActive?: boolean
      }
    )) => {
      const {
        // @ts-ignore
        beforeActive, afterActive
      } = options ?? {
        beforeActive: true,
        afterActive: false
      }
      setTabs(tabs => {
        const activeIndex = tabs.findIndex(tab => tab.active)
        const index = activeIndex !== -1 ? (
          activeIndex + (beforeActive ? 0 : 1) + (afterActive ? 1 : 0)
        ) : 0
        return [
          ...tabs.slice(0, index),
          tab,
          ...tabs.slice(index)
        ]
      })
    }, [setTabs])
  }
}
