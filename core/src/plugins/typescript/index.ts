import './index.scss'

import { useEffect, useMemo } from 'react'
import type {
  Editor
} from '@power-playground/core'
import {
  messenger
} from '@power-playground/core'
import { getDefaultStore, useAtom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'
import { mergeAll } from 'ramda'

import { useDocumentEventListener } from '../../hooks/useDocumentEventListener'
import { definePlugin } from '..'

import decorationProvider, { referencesPromise } from './providers/DecorationProvider'
import glyphProvider from './providers/GlyphProvider'
import { Setting } from './statusbar/Setting'
import { Versions } from './statusbar/Versions'
import { Langs } from './topbar/Langs'
import { compilerOptionsAtom, extraFilesAtom, extraModulesAtom } from './atoms'
import { use } from './use'

export interface ExtraFile {
  content: string
  filePath: string
}

declare module '@power-playground/core' {
  export interface PluginConfigures {
    typescript: {
      compilerOptions?: monacoEditor.languages.typescript.CompilerOptions
      extraFiles?: ExtraFile[]
      extraModules?: ExtraFile[]
    }
  }
}

const store = getDefaultStore()

export interface TypeScriptPluginX {
  ExtShareState: {
    typescriptVersion: string
    changeTypescriptVersion: (ts: string) => void
    language: 'javascript' | 'typescript'
    changeLanguage: (lang: 'javascript' | 'typescript') => void
  }
}

const editor: Editor<TypeScriptPluginX> = {
  use,
  useShare({
    curFilePath, language, typescriptVersion
  }, monaco) {
    const [compilerOptions] = useAtom(compilerOptionsAtom)
    const defaults = useMemo(() => {
      if (!monaco || !typescriptVersion) return

      if (language === 'javascript') {
        return monaco.languages.typescript.javascriptDefaults
      } else {
        return monaco.languages.typescript.typescriptDefaults
      }
    }, [language, monaco, typescriptVersion])
    useEffect(() => {
      if (!defaults || !monaco) return

      defaults.setCompilerOptions({ ...defaults.getCompilerOptions(), ...compilerOptions })

      console.group('monaco detail data')
      console.log('typescript.version', monaco.languages.typescript.typescriptVersion)
      console.log('typescript.CompilerOptions', monaco.languages.typescript.typescriptDefaults.getCompilerOptions())
      console.groupEnd()
    }, [compilerOptions, defaults, monaco])

    const [extraFiles] = useAtom(extraFilesAtom)
    const [extraModules] = useAtom(extraModulesAtom)
    useEffect(() => {
      if (!defaults || !monaco) return

      extraFiles.forEach(({ content, filePath }) => {
        monaco.editor.createModel(
          content,
          language === 'javascript' ? 'javascript' : 'typescript',
          monaco.Uri.parse(filePath)
        )
      })
      extraModules.forEach(({ content, filePath }) => {
        monaco.editor.createModel(
          content,
          language === 'javascript' ? 'javascript' : 'typescript',
          monaco.Uri.parse(`file:///node_modules/${filePath}`)
        )
      })

      return () => {
        monaco.editor.getModels().forEach(model => {
          if (model.uri.path !== curFilePath) model.dispose()
        })
      }
    }, [monaco, curFilePath, language, defaults, extraFiles, extraModules])

    useDocumentEventListener('mousedown', e => {
      if (e.target instanceof HTMLElement && e.target.classList.contains('ts__button-decoration')) {
        messenger.then(m => m.display('warning', 'Switching dependency version is not supported yet'))
      }
    })
  },
  preload(monaco) {
    return function (disposes: (() => void)[]) {
      return () => disposes.forEach(dispose => dispose())
    }([
      monaco.editor.addCommand({
        id: 'typescript-imports',
        run() {
          messenger.then(m => m.display('warning', 'Switching dependency version is not supported yet'))
        }
      }).dispose,
      monaco.languages.registerCodeLensProvider(['javascript', 'typescript'], {
        async provideCodeLenses(model, cancelToken) {
          if (model.isDisposed()) return
          const references = await referencesPromise
          if (cancelToken.isCancellationRequested) return

          const lenses: monacoEditor.languages.CodeLens[] = []
          references.forEach(ref => {
            const [start] = ref.position
            const startP = model.getPositionAt(start)
            const range = new monaco.Range(startP.lineNumber, startP.column, startP.lineNumber, startP.column)
            lenses.push({
              range,
              id: 'typescript-imports',
              command: {
                id: 'typescript-imports',
                title: 'Switch @latest',
                arguments: [ref.module, 'latest']
              }
            }, {
              range,
              id: 'typescript-imports',
              command: {
                id: 'typescript-imports',
                title: '@beta',
                arguments: [ref.module, 'beta']
              }
            }, {
              range,
              command: {
                id: 'typescript-imports',
                title: `[${ref.module}]`,
                arguments: [ref.module]
              }
            })
          })
          return { lenses, dispose: () => void 0 }
        }
      }).dispose
      // TODO support inline completion version
    ])
  },
  load: (editor, monaco) => {
    const re = require as unknown as (id: string[], cb: (...args: any[]) => void) => void
    let typescript: typeof import('typescript') | undefined = undefined
    const lazyTS = new Promise<typeof import('typescript')>(resolve => {
      if (typescript === undefined) {
        re(['vs/language/typescript/tsWorker'], () => {
          // @ts-ignore
          typescript = window.ts
          // @ts-ignore
          resolve(window.ts as unknown as typeof import('typescript'))
        })
      } else {
        resolve(typescript)
      }
    })
    return [
      decorationProvider(editor, monaco, lazyTS),
      glyphProvider(editor, monaco, lazyTS)
    ]
  },
  topbar: [Langs],
  statusbar: [Versions, Setting]
}

export default definePlugin<'typescript', TypeScriptPluginX>('typescript', conf => {
  if (conf?.compilerOptions) {
    store.set(compilerOptionsAtom, mergeAll([
      compilerOptionsAtom.init,
      conf.compilerOptions
    ]))
  }
  if (conf?.extraFiles) {
    store.set(extraFilesAtom, conf.extraFiles)
  }
  if (conf?.extraModules) {
    store.set(extraModulesAtom, conf.extraModules)
  }

  return { editor }
})
