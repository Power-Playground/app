import { useMemo } from 'react'
import type { ReactRenderProps } from '@power-playground/core'

import CodeHighlighter from '../code-highlighter'
import { useFiles } from '../files'

export function DTSPanel({ UI, devtoolsWindow: { simport } }: ReactRenderProps) {
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
}
