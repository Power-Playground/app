import type {
  IStandaloneCodeEditor
} from '@power-playground/core'
import {
  classnames, messenger
} from '@power-playground/core'
import type * as monacoEditor from 'monaco-editor'

import {
  createProviderMaker, DEFAULT_WATCH_EVENT_KEYS,
  isWhatArgs,
  StopThisTimeError
} from '../../../utils'
import { getNamespaces } from '../utils'

const GLYPH_PREFIX = 'ppd-plugins-typescript-glyph-margin'
const createGlyph = (
  monaco: typeof monacoEditor,
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  line: number, content: string,
  eleResolver?: (ele: HTMLDivElement) => void
): monacoEditor.editor.IGlyphMarginWidget => ({
  getDomNode() {
    const domNode = document.createElement('div')
    domNode.innerHTML = content
    eleResolver?.(domNode)
    return domNode
  },
  getPosition() {
    return {
      lane: monaco.editor.GlyphMarginLane.Right,
      zIndex: 100,
      range: new monaco.Range(line, 1, line, 1)
    }
  },
  getId: () => `${GLYPH_PREFIX} ${GLYPH_PREFIX}__${line}`
})

const glyphProviderMaker = createProviderMaker((editor, monaco) => {
  const glyphMarginWidgets: monacoEditor.editor.IGlyphMarginWidget[] = []

  return {
    glyphMarginWidgets,
    addGlyph: (line: number, content: string, eleResolver?: (ele: HTMLDivElement) => void) => {
      const model = editor.getModel()
      if (!model) throw new Error('model not found')

      const widget = createGlyph(monaco, editor, line, content, eleResolver)
      editor.addGlyphMarginWidget(widget)
      glyphMarginWidgets.push(widget)
      editor.updateOptions({ glyphMargin: true })
      return widget.getId()
    },
    removeGlyph: (id: string) => {
      const index = glyphMarginWidgets.findIndex(widget => widget.getId() === id)
      if (index !== -1) {
        editor.removeGlyphMarginWidget(glyphMarginWidgets[index])
        glyphMarginWidgets.splice(index, 1)
      }
      if (glyphMarginWidgets.length === 0) {
        editor.updateOptions({ glyphMargin: false })
      }
    }
  }
}, (editor, {
  glyphMarginWidgets
}) => {
  editor.updateOptions({ glyphMargin: false })
  glyphMarginWidgets.forEach(widget => editor.removeGlyphMarginWidget(widget))
}, {
  watchEventKeys: [
    ...DEFAULT_WATCH_EVENT_KEYS,
    'onDidChangeModelDecorations'
  ],
  anytime(type, ...args) {
    if (isWhatArgs(type, 'onDidChangeModelDecorations', args)) {
      const [e] = args
      if (!e.affectsMinimap) {
        throw StopThisTimeError.instance
      }
    }
  }
})

export default (
  editor: IStandaloneCodeEditor,
  monaco: typeof monacoEditor,
  lazyTS: Promise<typeof import('typescript')>
) => {
  type ProviderDefaultParams = Parameters<ReturnType<typeof createProviderMaker>> extends [
    ...infer T, infer _Ignore
  ] ? T : never
  const providerDefaultParams: ProviderDefaultParams = [monaco, editor, { languages: ['javascript', 'typescript'] }]
  const modelNamespacesCache = new Map<string, [
    content: string,
    namespaces: ReturnType<typeof getNamespaces>,
  ]>()
  return glyphProviderMaker(
    ...providerDefaultParams, async (model, { mountInitValue: {
      addGlyph, removeGlyph
    } }) => {
      const ts = await lazyTS
      const uri = model.uri.toString()
      const cache = modelNamespacesCache.get(uri)
      const namespaces = cache?.[1] ?? modelNamespacesCache.set(uri, [
        model.getValue(),
        getNamespaces(ts, model.getValue())
      ]).get(uri)![1]
      const visibleRanges = editor.getVisibleRanges()

      const gids: string[] = []
      Object.entries(namespaces)
        .filter(([name]) => ['describe', 'it'].some(n => name.startsWith(n)))
        .map(([name, ns]) => {
          type FlatItem = [number, string, ReturnType<typeof getNamespaces>['describe'][0]]
          return ns
            .reduce((acc, namespace) => {
              const realLine = model.getPositionAt(namespace.top.pos).lineNumber
              let line = realLine
              let inFold = false
              let prevVisibleEndLineNumber = 1
              visibleRanges.forEach(({ startLineNumber, endLineNumber }) => {
                if (realLine >= endLineNumber && realLine <= startLineNumber) {
                  inFold = true
                  return
                }
                if (realLine <= startLineNumber)
                  return

                const offset = startLineNumber - prevVisibleEndLineNumber
                line -= offset === 0 ? 0 : offset - 1
                prevVisibleEndLineNumber = endLineNumber
              })
              if (inFold) return acc
              return acc.concat([
                [line, name, namespace]
              ])
            }, [] as FlatItem[])
            .flat() as FlatItem
        })
        .forEach(([line, name, namespace]) => {
          const isDescribe = name.startsWith('describe')
          gids.push(addGlyph(line, `<span class='${classnames('codicon', `codicon-run${isDescribe ? '-all' : ''}`)}'></span>`, ele => {
            ele.onclick = () => {
              messenger.then(m => m.display('warning', 'Running test is not supported yet'))
              // ele.innerHTML = `<span class="${
              //   classnames('codicon', `codicon-check${isDescribe ? '-all' : ''}`)
              // }"></span>`
              ele.innerHTML = `<span class="${
                classnames('codicon', 'codicon-run-errors')
              }"></span>`
            }
          }))
        })
      return () => gids.forEach(id => removeGlyph(id))
    })
}
