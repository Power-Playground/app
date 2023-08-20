import { useContext, useEffect, useRef } from 'react'
import { isMacOS } from '@power-playground/core'

import type { DialogRef } from '../../../components/base/Dialog'
import { Popover } from '../../../components/base/Popover'
import { MonacoScopeContext } from '../../../contextes/MonacoScope'

import { HistoryDialog } from './HistoryDialog'

export function History() {
  const historyDialogRef = useRef<DialogRef>(null)

  const { editorInstance, store } = useContext(MonacoScopeContext) ?? {}
  const [, setCode] = store?.code ?? []
  const [theme] = store?.theme ?? ['light']
  useEffect(() => {
    if (!editorInstance) return

    editorInstance.onDidChangeConfiguration(console.log)
  }, [editorInstance])
  return <>
    <HistoryDialog
      theme={theme}
      ref={historyDialogRef}
      onChange={ch => setCode?.(ch.code)}
    />
    <Popover
      style={{ cursor: 'pointer' }}
      offset={[0, 3]}
      content={<>
        Show History(<code>
          {isMacOS ? '⌘' : 'Ctrl'}
        </code> + <code>H</code>)
      </>}
      onClick={() => historyDialogRef.current?.open()}
      >
      <div className='cldr codicon codicon-history' />
    </Popover>
  </>
}
