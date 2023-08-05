import { useEffect, useRef, useState } from 'react'

import { DevtoolsWindow } from '../../pages/eval-logs/devtools.ts'

type CodeHighlighter = typeof import('//chii/ui/components/code_highlighter/CodeHighlighter.ts')

export default ({
  code,
  lang,
  devtoolsWindow: { simport }
}: {
  code: string
  lang: string
  devtoolsWindow: Pick<DevtoolsWindow, 'simport'>
}) => {
  const [highlightNodeRef, setHighlightNodeRef] = useState<
    CodeHighlighter['highlightNode'] | undefined
  >(undefined)
  simport<CodeHighlighter>('ui/components/code_highlighter/CodeHighlighter.js')
    .then(({ highlightNode }) => setHighlightNodeRef(() => highlightNode))

  const preEleRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const preEle = preEleRef.current
    if (!preEle) return

    preEle.textContent = code
    highlightNodeRef?.(preEle, `text/${lang}`)
  }, [code, lang, highlightNodeRef])

  return <pre
    ref={preEleRef}
    style={{
      cursor: 'text',
      userSelect: 'text',
      whiteSpace: 'pre-wrap',
      margin: '0',
      padding: '0 4px'
    }}
  />
}
