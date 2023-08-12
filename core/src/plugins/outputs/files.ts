import { useSyncExternalStore } from 'react'
import * as Babel from '@babel/standalone'

import type { EvalLogsIframeParentEvent } from '../../eval-logs/bridge'
import { elBridgeC } from '../../eval-logs/bridge'

export let Files: (
  & Extract<EvalLogsIframeParentEvent, { type: 'compile-completed' }>['data'][number]
  & { originalText: string }
)[] = []

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

// TODO resolve babel plugins management

elBridgeC.on('compile-completed', files => {
  Files = files.map(({ name, text }) => {
    let code = text
    if (name.endsWith('.js')) {
      name = name.slice(7)
      try {
        code = Babel.transform(text, {
          presets: ['es2015'],
          plugins: [
          ],
          filename: name
        })?.code ?? ''
      } catch (e) {
        return {
          name: `${name} (compile error)`,
          originalText: text,
          // @ts-ignore
          text: e!.message!
        }
      }
    }
    return { name, originalText: text, text: code ?? '' }
  })
  listeners.forEach(func => func(Files))
})
