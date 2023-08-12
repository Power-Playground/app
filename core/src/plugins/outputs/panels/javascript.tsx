import { useMemo } from 'react'
import { defineDevtoolsPanel } from '@power-playground/core'

import CodeHighlighter from '../code-highlighter.tsx'
import { useFiles } from '../files.ts'

export const JSPanel = defineDevtoolsPanel('outputs.js', '.JS', 'react', ({ UI, devtoolsWindow: { simport } }) => {
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
