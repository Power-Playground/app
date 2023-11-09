import { atom } from 'jotai'

export const tabsAtom = atom<{
  id: string
  icon?: string
  title: string
  closeable?: boolean
  active?: boolean
}[]>([])
