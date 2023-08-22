import { useCallback, useMemo } from 'react'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface EditState {
  code: string
  time: number
  lang?: string
  cursor?: number
}

export const localEditStateHistoryAtom = atomWithStorage<EditState[]>('ppd-edit-state-history', [])

export function useLocalEditStateHistory() {
  const [history, setHistory] = useAtom(localEditStateHistoryAtom)

  const addEditState = useCallback((editState: EditState) => {
    setHistory(old => [editState, ...old])
  }, [setHistory])
  const removeEditState = useCallback((index: number) => {
    setHistory(old => [...old.slice(0, index), ...old.slice(index + 1)])
  }, [setHistory])
  const replaceEditState = useCallback((editState: EditState, index = history.length - 1) => {
    setHistory(old => [...old.slice(0, index), editState, ...old.slice(index + 1)])
  }, [history.length, setHistory])
  return {
    history,
    setHistory,
    addEditState,
    removeEditState,
    replaceEditState
  }
}
