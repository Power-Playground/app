import type * as monacoEditor from 'monaco-editor'

import { elBridgeP } from '../../eval-logs/bridge'
import { definePlugin } from '../index'

import { Run } from './Run'

let compileResult: monacoEditor.languages.typescript.EmitOutput | undefined

if (import.meta.hot) {
  if (import.meta.hot.data['plugins:outputs:compileResult']) {
    compileResult = import.meta.hot.data['plugins:outputs:compileResult']
  }
}

declare module '@power-playground/core' {
  interface PluginConfigures {
    outputs: {
      foo: string
    }
  }
}

export const id = 'outputs'

export default definePlugin(id, () => ({
  editor: {
    preload(monaco) {
      const dispose = elBridgeP.on('compile', () => {
        if (!compileResult) {
          elBridgeP.send('compile-completed', [{
            name: '(compile error)',
            text: 'No output to compile, maybe the Editor is still loading'
          }])
          return
        }

        elBridgeP.send('compile-completed', compileResult.outputFiles)
      })

      const disposables = [
        monaco.languages.registerCompletionItemProvider('typescript', {
          triggerCharacters: ['@'],
          async provideCompletionItems(model, position) {
            if (position.lineNumber !== 1) return

            const line = model.getLineContent(position.lineNumber)
            if (line.startsWith('// @')) {
              return {
                suggestions: [
                  {
                    label: 'devtools.output.compiled',
                    detail: 'Display the compiled output in the console\'s `.JS` tab',
                    kind: monaco.languages.CompletionItemKind.Text,
                    insertText: 'devtools.output.compiled',
                    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                  }
                ]
              }
            }
          }
        })
      ]
      return () => {
        compileResult = undefined
        dispose()
        disposables.forEach(d => d.dispose())
      }
    },
    load(editor, monaco) {
      editor.onDidChangeModelContent(function compile() {
        const model = editor.getModel()
        if (model) {
          let worker:
            | ReturnType<typeof monaco.languages.typescript.getTypeScriptWorker>
            | Promise<undefined>
            = Promise.resolve(undefined)
          let isJS = false
          if (model.uri.path.match(/\.tsx?$/)) {
            worker = monaco.languages.typescript.getTypeScriptWorker()
          }
          if (model.uri.path.match(/\.jsx?$/)) {
            isJS = true
            worker = monaco.languages.typescript.getJavaScriptWorker()
          }
          worker
            .then(worker => worker?.(model.uri))
            .then(client => client?.getEmitOutput(model.uri.toString()))
            .then(result => {
              if (!result) return

              compileResult = result
              if (isJS) {
                const modelContent = model.getValue()
                compileResult.outputFiles = [
                  {
                    name: model.uri.toString(),
                    writeByteOrderMark: false,
                    text: modelContent
                  }
                ].concat(compileResult.outputFiles)
              }
              if (import.meta.hot) {
                import.meta.hot.data['plugins:outputs:compileResult'] = compileResult
              }
              elBridgeP.send('compile-completed', compileResult.outputFiles)
            })
        }
        return compile
      }())
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => elBridgeP.send('run'))
    },
    topbar: [Run]
  },
  devtools: ({ importInEvalLogs }) => importInEvalLogs(
    new URL(
      Object.values(import.meta.glob('./devtools.ts'))[0]
        .toString()
        .replace(/.*import\("(.+?)"\).*/, '$1'),
      import.meta.url
    ).href
  ).then(m => m.default)
}))
