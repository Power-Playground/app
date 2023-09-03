import { atom } from 'jotai'

export const saveStatusAtom = atom<{
  [uri: string]: boolean
}>({})
