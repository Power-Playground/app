import './index.scss'

import { useEffect, useMemo } from 'react'
import type { Editor } from '@power-playground/core'
import { messenger } from '@power-playground/core'
import { atom, getDefaultStore, useAtom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'
import { mergeAll, mergeDeepLeft } from 'ramda'

import { useDocumentEventListener } from '../../hooks/useDocumentEventListener'
import { definePlugin } from '..'

import { Langs } from './statusbar/Langs'
import { Versions } from './statusbar/Versions'
import { depLoadErrorSymbol, moduleLoadErrorSymbol, moduleLoadingStateSymbol, resolveDeps } from './modules'
import { use } from './use'
import { getReferencesForModule, mapModuleNameToModule } from './utils'

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
  allowSyntheticDefaultImports: true,
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

function promiseStatus(promise: Promise<any>) {
  let status = 'pending'
  return Promise.race([
    promise.then(() => status = 'fulfilled'),
    promise.catch(() => status = 'rejected'),
    new Promise(resolve => setTimeout(() => resolve(status), 0))
  ])
}

type RefForModule = ReturnType<typeof getReferencesForModule>
let resolveReferences: (value: RefForModule) => void = () => void 0
// TODO refactor as Map to reveal the promise by filePath
let referencesPromise = new Promise<RefForModule>(re => {
  resolveReferences = re
})
if (import.meta.hot) {
  const hotReferencesPromise = import.meta.hot.data['ppd:typescript:referencesPromise']
  hotReferencesPromise && (referencesPromise = hotReferencesPromise)
}
let prevRefs: RefForModule = []
if (import.meta.hot) {
  const hotPrevRefs = import.meta.hot.data['ppd:typescript:prevRefs']
  hotPrevRefs && (prevRefs = hotPrevRefs)
}

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T

function foreachDeps(
  deps: Awaited<ReturnType<typeof resolveDeps>>,
  cb: (args: {
    moduleName: string
    filePath: string
    content: string
  }) => void,
  opts: {
    onDepLoadError?: (args: { depName: string; error: Error }) => void
  } = {}
) {
  const allModules = Object.entries(deps)
    .filter(([depName, dep]) => {
      dep[depLoadErrorSymbol] && opts.onDepLoadError?.({
        depName,
        error: new Error(dep[depLoadErrorSymbol]!)
      })
      return !dep[depLoadErrorSymbol]
    })
    .flatMap(([, dep]) => {
      return Object.entries(dep)
    })
  allModules.forEach(([moduleName, module]) => {
    if (module[moduleLoadingStateSymbol] === 'loaded') {
      Object.entries(module)
        .forEach(([filePath, content]) => cb({
          moduleName, filePath, content
        }))
      return
    }
    if (module[moduleLoadingStateSymbol] === 'error') {
      // TODO
    }
  })
}

async function resolveModules(
  monaco: typeof monacoEditor,
  oldRefs: RefForModule,
  newRefs: RefForModule,
  opts: {
    onDepLoadError?: (args: { depName: string; error: Error }) => void
  } = {}
) {
  const addRefs = newRefs.filter(ref => !oldRefs.some(({ module }) => module === ref.module))
  const delRefs = oldRefs.filter(ref => !newRefs.some(({ module }) => module === ref.module))
  const addDeps = await resolveDeps(addRefs.map(({ module, version }) => [module, version ?? 'latest']))
  const delDeps = await resolveDeps(delRefs.map(({ module, version }) => [module, version ?? 'latest']))
  const extraLibs = Object
    .entries(monaco.languages.typescript.typescriptDefaults.getExtraLibs())
    .map(([filePath, lib]) => [filePath, lib.content])
  foreachDeps(delDeps, ({ filePath }) => {
    const index = extraLibs.findIndex(([extPath]) => extPath === filePath)
    if (index !== -1) {
      extraLibs.splice(index, 1)
    }
  })
  foreachDeps(addDeps, ({ moduleName, filePath, content }) => {
    const index = extraLibs.findIndex(([extPath]) => extPath === filePath)
    if (index !== -1) {
      extraLibs.splice(index, 1)
    }
    extraLibs.push([`file:///node_modules/${moduleName}${filePath}`, content])
  }, {
    onDepLoadError: opts.onDepLoadError
  })
  if (
    Object.keys(delDeps).length === 0
    && Object.keys(addDeps).length === 0
  ) return
  monaco.languages.typescript.typescriptDefaults
    .setExtraLibs(extraLibs
      .reduce((acc, [filePath, content]) => {
        return acc.concat([{ filePath, content }])
      }, [] as {
        filePath?: string
        content: string
      }[]))
}

const modelDecorationIdsSymbol = '_modelDecorationIds'

const editorLoad: Editor<TypeScriptPluginX>['load'] = (editor, monaco) => {
  const re = require as unknown as (id: string[], cb: (...args: any[]) => void) => void
  let typescript: typeof import('typescript') | undefined = undefined
  const decorationsCollection = editor.createDecorationsCollection()

  let timeId: number | undefined = undefined
  let reject: (reason?: any) => void = () => void 0
  const debounce = (time: number) => {
    reject()
    timeId && clearTimeout(timeId)
    return new Promise<void>((resolve, _rej) => {
      reject = _rej
      timeId = setTimeout(() => {
        resolve()
      }, time) as unknown as number
    })
  }
  const modelDecorationIdsConfigurableEditor = editor as unknown as {
    [modelDecorationIdsSymbol]?: Map<string, string[]>
  }
  const modelDecorationIds = modelDecorationIdsConfigurableEditor[modelDecorationIdsSymbol]
    ?? (modelDecorationIdsConfigurableEditor[modelDecorationIdsSymbol] = new Map<string, string[]>())
  async function analysisCode() {
    if (await promiseStatus(referencesPromise) === 'fulfilled') {
      referencesPromise = new Promise<RefForModule>(re => {
        resolveReferences = re
      })
    }
    const model = editor.getModel()
    if (!model) return

    try { await debounce(300) } catch { return }

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

    const extraModules = store.get(extraModulesAtom).reduce((acc, { filePath }) => {
      const name = /((?:@[^/]*\/)?[^/]+)/.exec(filePath)?.[1]
      if (name && !acc.includes(name)) {
        acc.push(name)
      }
      return acc
    }, [] as string[])
    const references = getReferencesForModule(ts, content)
      .filter(ref => !ref.module.startsWith('.'))
      .filter(ref => !extraModules.includes(ref.module))
      .map(ref => ({
        ...ref,
        module: mapModuleNameToModule(ref.module)
      }))
      .reduce((acc, cur) => {
        const index = acc.findIndex(({ module }) => module === cur.module)
        if (index === -1) {
          acc.push(cur)
        }
        return acc
      }, [] as RefForModule)
    let resolveModulesFulfilled = () => void 0
    const dependencyLoadErrorReason = {} as Record<string, string>
    resolveModules(monaco, prevRefs, references, {
      onDepLoadError({ depName, error }) {
        dependencyLoadErrorReason[depName] = `⚠️ ${error.message}`
      }
    })
      .then(() => resolveModulesFulfilled())
    prevRefs = references
    if (import.meta.hot) {
      import.meta.hot.data['ppd:typescript:prevRefs'] = prevRefs
    }
    resolveReferences(references)
    if (import.meta.hot) {
      import.meta.hot.data['ppd:typescript:referencesPromise'] = referencesPromise
    }
    editor.removeDecorations(ids)
    const loadingDecorations: (
      & { loadedVersion: string, loadModule: string }
      & monacoEditor.editor.IModelDeltaDecoration
    )[] = references.map(ref => {
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
        loadModule: ref.module,
        loadedVersion: ref.version ?? 'latest',
        range,
        options: {
          isWholeLine: true,
          after: {
            content: '⚡️ Downloading...',
            inlineClassName
          }
        }
      }
    })
    const newIds = decorationsCollection.set(loadingDecorations)
    modelDecorationIds.set(uri, newIds)

    resolveModulesFulfilled = () => {
      editor.removeDecorations(newIds)
      const loadedDecorations = loadingDecorations.map(d => {
        const error = dependencyLoadErrorReason[`${d.loadModule}@${d.loadedVersion}`]
        return mergeDeepLeft({
          options: { after: { content: error ?? `@${d.loadedVersion}` } }
        }, d)
      })
      const loadedIds = decorationsCollection.set(loadedDecorations)
      modelDecorationIds.set(uri, loadedIds)
    }
  }
  analysisCode().catch(console.error)
  const disposes = [
    editor.onDidChangeModel(analysisCode).dispose,
    editor.onDidChangeModelContent(analysisCode).dispose,
    editor.onDidFocusEditorWidget(analysisCode).dispose
  ]

  return () => {
    disposes.forEach(dispose => dispose())
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
    ])
  },
  load: editorLoad,
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
