import { useMemo } from 'react'
import type * as monacoEditor from 'monaco-editor'

import { elBridgeP } from '../../eval-logs/bridge.ts'
import { useFiles } from '../../eval-logs/files.ts'
import { defineDevtoolsPanel, definePlugin } from '../index.tsx'

import CodeHighlighter from './code-highlighter.tsx'

const JSPanel = defineDevtoolsPanel('outputs.js', '.JS', 'react', ({ UI, devtoolsWindow: { simport } }) => {
  const files = useFiles()
  const containerError = useMemo(
    () => files.find(({ name }) => name.endsWith('(compile error)')),
    [files]
  )
  if (containerError) {
    return <CodeHighlighter
      code={useMemo(
        () => files
          .filter(({ name }) => name.endsWith('(compile error)'))
          .map(({ text }) => text)
          .join('\n\n'),
        [files]
      )}
      lang='text'
      devtoolsWindow={{ simport }}
    />
  }
  return <CodeHighlighter
    code={useMemo(
      () => files
        .filter(({ name }) => name.endsWith('.js'))
        .map(({ name, text, originalText }) => `// @filename:${name}\n${
          originalText.match(/^\/\/ @devtools.output.compiled\r?\n/)
            ? text
            : originalText
        }`)
        .join('\n\n'),
      [files]
    )}
    lang='javascript'
    devtoolsWindow={{ simport }}
  />
})
const DTSPanel = defineDevtoolsPanel('outputs.d.ts', '.D.TS', 'react', ({ UI, devtoolsWindow: { simport } }) => {
  const files = useFiles()
  return <CodeHighlighter
    code={useMemo(
      () => files
        .filter(({ name }) => name.endsWith('.d.ts'))
        .map(({ name, text }) => `// @filename:${name}\n${text}`)
        .join('\n\n'),
      [files]
    )}
    lang='typescript'
    devtoolsWindow={{ simport }}
  />
})
// Errors
// AST

let compileResult: monacoEditor.languages.typescript.EmitOutput | undefined

export default definePlugin({
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
          if (model.uri.path.match(/\.tsx?$/)) {
            worker = monaco.languages.typescript.getTypeScriptWorker()
          }
          if (model.uri.path.match(/\.jsx?$/)) {
            worker = monaco.languages.typescript.getJavaScriptWorker()
          }
          worker
            .then(worker => worker?.(model.uri))
            .then(client => client?.getEmitOutput(model.uri.toString()))
            .then(result => {
              if (!result) return

              compileResult = result
              elBridgeP.send('compile-completed', result.outputFiles)
            })
        }
        return compile
      }())
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => elBridgeP.send('run'))
    }
  },
  devtools: {
    panels: [JSPanel, DTSPanel]
  }
})
