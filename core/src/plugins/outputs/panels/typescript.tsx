import { useMemo } from 'react'
import { defineDevtoolsPanel } from '@power-playground/core'

import { useFiles } from '../../../eval-logs/files.ts'
import CodeHighlighter from '../code-highlighter.tsx'

export const DTSPanel = defineDevtoolsPanel('outputs.d.ts', '.D.TS', 'react', ({ UI, devtoolsWindow: { simport } }) => {
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
