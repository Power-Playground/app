import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const displayLeftBarAtom = atom(false)
export const isVimModeAtom = atomWithStorage('IS_VIM_MODE', false)