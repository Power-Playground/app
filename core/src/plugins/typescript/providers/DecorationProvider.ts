import type { IStandaloneCodeEditor } from '@power-playground/core'
import { getDefaultStore } from 'jotai'
import type * as monacoEditor from 'monaco-editor'
import { mergeDeepLeft } from 'ramda'

import {
  createProviderMaker
} from '../../../utils'
import { extraModulesAtom } from '../atoms'
import { resolveModules } from '../modules'
import { getReferencesForModule, mapModuleNameToModule } from '../utils'

const store = getDefaultStore()

type RefForModule = ReturnType<typeof getReferencesForModule>
let resolveReferences: (value: RefForModule) => void = () => void 0
// TODO refactor as Map to reveal the promise by filePath
export let referencesPromise = new Promise<RefForModule>(re => {
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

// TODO make utility
function promiseStatus(promise: Promise<any>) {
  let status = 'pending'
  return Promise.race([
    promise.then(() => status = 'fulfilled'),
    promise.catch(() => status = 'rejected'),
    new Promise(resolve => setTimeout(() => resolve(status), 0))
  ])
}

const modelDecorationIdsSymbol = '_modelDecorationIds'

const addDecorationProvider = createProviderMaker(editor => {
  const decorationsCollection = editor.createDecorationsCollection()

  const modelDecorationIdsConfigurableEditor = editor as unknown as {
    [modelDecorationIdsSymbol]?: Map<string, string[]>
  }
  const modelDecorationIds = modelDecorationIdsConfigurableEditor[modelDecorationIdsSymbol]
    ?? (modelDecorationIdsConfigurableEditor[modelDecorationIdsSymbol] = new Map<string, string[]>())

  let dependencyLoadErrorReason: Record<string, string>
  if (import.meta.hot) {
    const hotDependencyLoadErrorReason = import.meta.hot.data['ppd:typescript:dependencyLoadErrorReason']
    hotDependencyLoadErrorReason
      ? (dependencyLoadErrorReason = hotDependencyLoadErrorReason)
      : (dependencyLoadErrorReason = import.meta.hot.data['ppd:typescript:dependencyLoadErrorReason'] = {})
  } else {
    dependencyLoadErrorReason = {}
  }

  return { decorationsCollection, modelDecorationIds, dependencyLoadErrorReason }
}, (editor, {
  decorationsCollection,
  modelDecorationIds
}) => {
  const uri = editor.getModel()?.uri.toString()
  if (!uri) return

  const ids = modelDecorationIds.get(uri)
  if (!ids) return

  editor.removeDecorations(ids)
  modelDecorationIds.delete(uri)
  decorationsCollection.clear()
  if (import.meta.hot) {
    import.meta.hot.data['ppd:typescript:dependencyLoadErrorReason'] = {}
  }
}, {
  anytime: async () => {
    if (await promiseStatus(referencesPromise) === 'fulfilled') {
      referencesPromise = new Promise<RefForModule>(re => resolveReferences = re)
    }
  }
})

export default (
  editor: IStandaloneCodeEditor,
  monaco: typeof monacoEditor,
  lazyTS: Promise<typeof import('typescript')>
) => addDecorationProvider(
  monaco, editor, { languages: ['javascript', 'typescript'] }, async (model, { mountInitValue: {
    modelDecorationIds,
    decorationsCollection,
    dependencyLoadErrorReason
  }, isCancel }) => {
    const uri = model.uri.toString()
    const ids = modelDecorationIds.get(uri)
      ?? modelDecorationIds.set(uri, []).get(uri)!

    const content = model.getValue()
    const ts = await lazyTS

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
    resolveModules(monaco, prevRefs, references, {
      onDepLoadError({ depName, error }) {
        dependencyLoadErrorReason[depName] = `⚠️ ${error.message}`
      }
    })
      .then(() => {
        if (isCancel.value) return
        resolveModulesFulfilled()
      })
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
    return () => void 0
  })
