import './index.scss'

import { useEffect, useMemo } from 'react'
import type { Editor } from '@power-playground/core'
import { messenger } from '@power-playground/core'
import { atom, getDefaultStore, useAtom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'
import { mergeAll } from 'ramda'
import sentinel from 'sentinel-js'

import { definePlugin } from '..'

import { Langs } from './statusbar/Langs'
import { Versions } from './statusbar/Versions'
import { use } from './use'
import { getReferencesForModule } from './utils'

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

export const compilerOptionsAtom = atom<
  monacoEditor.languages.typescript.CompilerOptions
>({
  target: 4,
  module: 99,
  moduleResolution: 2,
  declaration: true,
  lib: ['esnext', 'dom', 'esnext.disposable']
})

export const extraFilesAtom = atom<ExtraFile[]>([])
export const extraModulesAtom = atom<ExtraFile[]>([])

export interface TypeScriptPluginX {
  ExtShareState: {
    typescriptVersion: string
    changeTypescriptVersion: (ts: string) => void
    language: 'javascript' | 'typescript'
    changeLanguage: (lang: 'javascript' | 'typescript') => void
  }
}

const modelDecorationIdsSymbol = '_modelDecorationIds'

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
        provideCodeLenses(model) {
          if (model.isDisposed()) return

          const lenses: monacoEditor.languages.CodeLens[] = []
          const queryRegex = /^import\s+(?:(?:\*\s+as\s+)?\w+\s+from\s+)?['"]([^'"]+)['"]$/gm

          const text = model.getValue()
          let match: RegExpExecArray | null

          while ((match = queryRegex.exec(text)) !== null) {
            const end = match.index + match[0].length - 1
            const endPos = model.getPositionAt(end)
            lenses.push({
              range: new monaco.Range(endPos.lineNumber, endPos.column, endPos.lineNumber, endPos.column),
              id: 'typescript-imports',
              command: {
                id: 'typescript-imports',
                title: 'Switch @latest'
              }
            }, {
              range: new monaco.Range(endPos.lineNumber, endPos.column, endPos.lineNumber, endPos.column),
              id: 'typescript-imports',
              command: {
                id: 'typescript-imports',
                title: '@beta'
              }
            })
          }
          return { lenses, dispose: () => void 0 }
        }
      }).dispose
    ])
  },
  load(editor, monaco) {
    const re = require as unknown as (id: string[], cb: (...args: any[]) => void) => void
    let typescript: typeof import('typescript') | undefined = undefined
    const decorationsCollection = editor.createDecorationsCollection()

    const modelDecorationIdsConfigurableEditor = editor as unknown as {
      [modelDecorationIdsSymbol]?: Map<string, string[]>
    }
    const modelDecorationIds = modelDecorationIdsConfigurableEditor[modelDecorationIdsSymbol]
      ?? (modelDecorationIdsConfigurableEditor[modelDecorationIdsSymbol] = new Map<string, string[]>())
    const analysisCodeDisposable = editor.onDidChangeModelContent(function analysisCode() {
      const model = editor.getModel()
      if (!model) return analysisCode

      ;(async () => {
        const uri = model.uri.toString()
        const ids = modelDecorationIds.get(uri)
          ?? modelDecorationIds.set(uri, []).get(uri)!

        const content = model.getValue()
        const ts = await new Promise<typeof import('typescript')>(resolve => {
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

        const references = getReferencesForModule(ts, content)
        editor.removeDecorations(ids)
        const newIds = decorationsCollection.set(references.map(ref => {
          const [start, end] = ref.position
          const startP = model.getPositionAt(start)
          const endP = model.getPositionAt(end)
          const range = new monaco.Range(
            startP.lineNumber,
            startP.column + 1,
            endP.lineNumber,
            endP.column + 1
          )
          const inlineClassName = `ts__button-decoration ts__button-decoration__position-${start}__${end}`
          return {
            range,
            options: {
              isWholeLine: true,
              after: {
                content: `@${ref.version ?? 'latest'}`,
                inlineClassName
              }
            }
          } as monacoEditor.editor.IModelDeltaDecoration
        }))
        modelDecorationIds.set(uri, newIds)
      })()
      return analysisCode
    }())
    const watchButtonDecoration = (el: HTMLDivElement) => {
      el.addEventListener('mousedown', () => {
        messenger.then(m => m.display('warning', 'Switching dependency version is not supported yet'))
      })
    }
    sentinel.on('.ts__button-decoration', watchButtonDecoration)

    return () => {
      analysisCodeDisposable.dispose()
      sentinel.off('.ts__button-decoration', watchButtonDecoration)
    }
  },
  topbar: [Langs],
  statusbar: [Versions]
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
