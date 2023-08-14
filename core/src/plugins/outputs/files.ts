import { useSyncExternalStore } from 'react'
import type { EvalLogsIframeParentEvent } from '@power-playground/core'
import { elBridgeC } from '@power-playground/core'

export let Files: (
  & Extract<EvalLogsIframeParentEvent, { type: 'compile-completed' }>['data'][number]
  & { originalText: string }
)[] = []

export function setFiles(files: typeof Files) {
  Files = files
  listeners.forEach(listener => listener(Files))
}

type Listener = (files: typeof Files) => void | Promise<void>
const listeners: Listener[] = []
const getFilesSubscribe = (callback: Listener) => {
  listeners.push(callback)
  elBridgeC.send('compile')
  return () => {
    const index = listeners.indexOf(callback)
    listeners.splice(index, 1)
  }
}
export function useFiles() {
  return useSyncExternalStore<typeof Files>(getFilesSubscribe, () => Files)
}
