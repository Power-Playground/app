import { useCallback } from 'react'
import { getDefaultStore, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface EditState {
  code: string
  time: number
  lang?: string
  cursor?: {
    readonly lineNumber: number;
    readonly column: number;
  }
}

const store = getDefaultStore()

export const localEditStateHistoryAtom = atomWithStorage<EditState[]>('ppd-edit-state-history', [])

export function dispatchEditState(type: 'add' | 'remove' | 'replace', editState: Omit<EditState, 'time'>, index?: number) {
  const localEditState = store.get(localEditStateHistoryAtom)
  if (type === 'add') {
    store.set(localEditStateHistoryAtom, [
      { ...editState, time: Date.now() },
      ...localEditState
    ])
  }
  if (type === 'remove') {
    if (index === undefined) throw new Error('index is required when type is remove')

    store.set(localEditStateHistoryAtom, [
      ...localEditState.slice(0, index),
      ...localEditState.slice(index + 1)
    ])
  }
  if (type === 'replace') {
    if (index === undefined) throw new Error('index is required when type is replace')

    store.set(localEditStateHistoryAtom, [
      ...localEditState.slice(0, index),
      { ...editState, time: Date.now() },
      ...localEditState.slice(index + 1)
    ])
  }
}

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
