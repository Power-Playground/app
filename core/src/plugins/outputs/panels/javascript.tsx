import { useMemo } from 'react'
import type { ReactRenderProps } from '@power-playground/core'

import CodeHighlighter from '../code-highlighter.tsx'
import { useFiles } from '../files.ts'

export function JSPanel({ UI, devtoolsWindow: { simport } }: ReactRenderProps) {
  const files = useFiles()
  const containerError = useMemo(
    () => files.find(({ name }) => name.endsWith('(compile error)')),
    [files]
  )
  const code = useMemo(
    () => {
      if (containerError) return files
        .filter(({ name }) => name.endsWith('(compile error)'))
        .map(({ text }) => text)
        .join('\n\n')

      return files
        .filter(({ name }) => name.endsWith('.js'))
        .map(({ name, text, editorText }) => `// @filename:${name}\n${
          editorText.match(/^\/\/ @devtools.output.compiled\r?\n/)
            ? text
            : editorText
        }`)
        .join('\n\n')
    },
    [containerError, files]
  )
  return <CodeHighlighter
    code={code}
    lang={containerError ? 'text' : 'javascript'}
    devtoolsWindow={{ simport }}
  />
}
