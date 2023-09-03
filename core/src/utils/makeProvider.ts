import type { IStandaloneCodeEditor } from '@power-playground/core'
import type * as monacoEditor from 'monaco-editor'

import { asyncDebounce } from './asyncDebounce'

export type Provider<T> = (
  model: monacoEditor.editor.ITextModel,
  opts: { mountInitValue: T; isCancel: { value: boolean } },
) => Promise<() => void> | (() => void)

export type WatchEventKeys = Extract<keyof IStandaloneCodeEditor, `onDid${string}`>

export const DEFAULT_WATCH_EVENT_KEYS = [
  'onDidChangeModel',
  'onDidChangeModelContent',
  'onDidFocusEditorWidget'
] as WatchEventKeys[]

export class StopThisTimeError extends Error {
  constructor() {
    super('stop this time')
  }
  static instance = new StopThisTimeError()
}

export function isWhatArgs<
  T extends WatchEventKeys | null
>(lt: string | null, rt: T, args: unknown[]): args is (
  T extends keyof IStandaloneCodeEditor
    ? Parameters<
      Parameters<IStandaloneCodeEditor[T]>[0]
    >
    : []
) {
  return lt === rt
}

export function makeProvider<T, Keys extends WatchEventKeys>(
  mount: (
    editor: IStandaloneCodeEditor,
    monaco: typeof monacoEditor
  ) => T,
  clear: (
    editor: IStandaloneCodeEditor,
    mountInitValue: T,
    monaco: typeof monacoEditor
  ) => void,
  opts?: {
    anytime?: (type: Keys | null, ...args: unknown[]) => void
    watchEventKeys?: Keys[]
  }
) {
  const {
    anytime,
    watchEventKeys = DEFAULT_WATCH_EVENT_KEYS as Keys[]
  } = opts ?? {}
  return (
    monaco: typeof monacoEditor,
    editor: IStandaloneCodeEditor,
    selector: { languages: string[] },
    provider: Provider<T>
  ) => {
    const mountInitValue = mount(editor, monaco)

    const debounce = asyncDebounce()
    let isCancel = { value: false }
    let prevDispose: (() => void) | undefined = undefined

    async function callback(type: Keys | null, ...args: unknown[]) {
      try {
        anytime?.(type, ...args)
      } catch (e) {
        if (e instanceof StopThisTimeError) {
          return
        }
        console.error(e)
      }
      const model = editor.getModel()
      if (!model) return

      if (!selector.languages.includes(model.getLanguageId())) {
        clear(editor, mountInitValue, monaco)
        return
      }
      try { await debounce(300) } catch { return }

      isCancel.value = true
      isCancel = { value: false }

      prevDispose?.()
      prevDispose = await provider(model, { mountInitValue, isCancel })
    }
    callback(null).catch(console.error)
    return watchEventKeys
      .map(key => editor[key](callback.bind(null, key)).dispose)
      .reduce((acc, cur) => () => (acc(), cur()), () => {
        clear(editor, mountInitValue, monaco)
        prevDispose?.()
      })
  }
}
