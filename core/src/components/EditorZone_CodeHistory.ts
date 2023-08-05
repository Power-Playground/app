import { useEffect, useMemo, useReducer, useSyncExternalStore } from 'react'

export interface CodeHistoryItem {
  code: string
  time: number
}

const codeHistoryStorageKey = 'playground-history'

let codeHistory: CodeHistoryItem[]
try {
  codeHistory = JSON.parse(localStorage.getItem(codeHistoryStorageKey) || '[]')
} catch {
  codeHistory = []
}

const codeStorageListener: Function[] = []
function subscribeCodeHistory(callback: (codeHistory: CodeHistoryItem[]) => void) {
  codeStorageListener.push(callback)
  callback(codeHistory)
  return () => {
    const index = codeStorageListener.indexOf(callback)
    if (index !== -1) codeStorageListener.splice(index, 1)
  }
}
function setCodeHistory(newCodeHistory: CodeHistoryItem[]) {
  codeHistory = newCodeHistory
  localStorage.setItem(codeHistoryStorageKey, JSON.stringify(codeHistory))
  codeStorageListener.forEach(callback => callback(codeHistory))
}
const EMPTY: CodeHistoryItem[] = []

export function useCodeHistory() {
  const codes = useSyncExternalStore(subscribeCodeHistory, () => codeHistory ?? EMPTY)
  useEffect(() => {
    dispatch({ type: 'set', codes })
  }, [codes])
  const [data, dispatch] = useReducer((
    state: CodeHistoryItem[],
    action:
      | { type: 'set', codes: CodeHistoryItem[] }
      | { type: 'add', code: string }
      | { type: 'remove', index: number }
  ) => {
    switch (action.type) {
      case 'add':
        return [...state, { code: action.code, time: Date.now() }]
      case 'set':
        return action.codes
      case 'remove':
        return state.filter((_, i) => i !== action.index)
    }
  }, codes)
  useEffect(() => {
    setCodeHistory(data)
  }, [data])
  return [
    useMemo(() => [...data].reverse(), [data]),
    dispatch
  ] as const
}
