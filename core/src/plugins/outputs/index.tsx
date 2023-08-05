import { useMemo } from 'react'

import { useFiles } from '../../eval-logs/files.ts'
import { defineDevtoolsPanel, definePlugins } from '../index.tsx'
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

export default definePlugins({
  editor(monaco) {
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
    return () => disposables.forEach(d => d.dispose())
  },
  devtools: {
    panels: [JSPanel, DTSPanel]
  }
})
