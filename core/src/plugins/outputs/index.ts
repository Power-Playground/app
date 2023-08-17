import type { EvalLogsIframeParentEvent } from '@power-playground/core'
import { elBridgeP } from '@power-playground/core'

import { definePlugin } from '../index'

import { Run } from './Run'

let compileCompletedResult: Extract<EvalLogsIframeParentEvent, { type: 'compile-completed' }>['data'] | undefined

if (import.meta.hot) {
  if (import.meta.hot.data['plugins:outputs:compileResult']) {
    compileCompletedResult = import.meta.hot.data['plugins:outputs:compileCompletedResult']
  }
}

declare module '@power-playground/core' {
  export interface OutputsPluginConfigures {}
  interface PluginConfigures {
    outputs: OutputsPluginConfigures
  }
}

export const id = 'outputs'

export default definePlugin(id, () => {
  return ({
    editor: {
      preload(monaco) {
        const dispose = elBridgeP.on('compile', () => {
          if (!compileCompletedResult) {
            elBridgeP.send('compile-completed', {
              '': {
                originalText: '',
                outputFiles: [{
                  name: '(compile error)',
                  text: 'No output to compile, maybe the Editor is still loading',
                  writeByteOrderMark: false
                }]
              }
            })
            return
          }

          elBridgeP.send('compile-completed', compileCompletedResult)
        })

        const disposables = [
          monaco.languages.registerCompletionItemProvider(['typescript', 'javascript'], {
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
          compileCompletedResult = undefined
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

                const originalText = model.getValue()
                const uri = model.uri.toString()
                compileCompletedResult = {
                  [uri]: {
                    originalText,
                    outputFiles: result.outputFiles
                  }
                }
                const modelCompileCompletedResult = compileCompletedResult[uri]
                if (isJS) {
                  modelCompileCompletedResult.outputFiles = [
                    {
                      name: model.uri.toString(),
                      writeByteOrderMark: false,
                      text: originalText
                    }
                  ].concat(modelCompileCompletedResult.outputFiles)
                }
                if (import.meta.hot) {
                  import.meta.hot.data['plugins:outputs:compileCompletedResult'] = compileCompletedResult
                }
                elBridgeP.send('compile-completed', compileCompletedResult)
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
  })
})
