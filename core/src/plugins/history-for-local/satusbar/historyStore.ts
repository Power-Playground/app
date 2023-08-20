import { useEffect, useMemo, useReducer, useSyncExternalStore } from 'react'

export interface CodeHistoryItem {
  code: string
  time: number
}

const codeHistoryStorageKey = 'playground-history'

let historyStore: CodeHistoryItem[]
try {
  historyStore = JSON.parse(localStorage.getItem(codeHistoryStorageKey) || '[]')
} catch {
  historyStore = []
}

const codeStorageListener: Function[] = []
function subscribeCodeHistory(callback: (codeHistory: CodeHistoryItem[]) => void) {
  codeStorageListener.push(callback)
  callback(historyStore)
  return () => {
    const index = codeStorageListener.indexOf(callback)
    if (index !== -1) codeStorageListener.splice(index, 1)
  }
}
export function setCodeHistory(newCodeHistory: CodeHistoryItem[] | ((codeHistory: CodeHistoryItem[]) => CodeHistoryItem[])) {
  if (typeof newCodeHistory === 'function') {
    newCodeHistory = newCodeHistory(historyStore)
  }
  historyStore = newCodeHistory
  localStorage.setItem(codeHistoryStorageKey, JSON.stringify(historyStore))
  codeStorageListener.forEach(callback => callback(historyStore))
}
const EMPTY: CodeHistoryItem[] = []

export function useCodeHistory() {
  const codes = useSyncExternalStore(subscribeCodeHistory, () => historyStore ?? EMPTY)
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
