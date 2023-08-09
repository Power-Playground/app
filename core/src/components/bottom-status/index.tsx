import './index.scss'

import React, { useContext, useEffect, useRef, useState } from 'react'

import { isMacOS } from '../../utils'
import type { DialogRef } from '../Dialog.tsx'
import { HelpDialog } from '../editor-zone/HelpDialog.tsx'
import { MonacoScopeContext } from '../EditorZone.tsx'
import { Popover } from '../Popover.tsx'

import { History } from './History.tsx'
import { TypescriptVersionStatus } from './TypescriptVersionStatus.tsx'

const prefix = 'ppd-bottom-status'

export function BottomStatus() {
  const { editorInstance } = useContext(MonacoScopeContext) ?? {}

  const helpDialogRef = useRef<DialogRef>(null)

  const [[line, column], setLineAndColumn] = useState<[number, number]>([0, 0])
  useEffect(() => {
    if (!editorInstance) return

    const updateLineAndColumn = () => {
      const pos = editorInstance.getPosition()
      if (pos) setLineAndColumn([pos.lineNumber, pos.column])
    }
    editorInstance.onDidChangeCursorPosition(updateLineAndColumn)
    updateLineAndColumn()
  }, [editorInstance])
  return <div className={`monaco-editor ${prefix}`}>
    <Popover
      style={{ cursor: 'pointer' }}
      offset={[0, 3]}
      content={<>
        Find Help(<code>{isMacOS ? '^' : 'Ctrl'}</code> + <code>/</code>)
      </>}
      onClick={() => helpDialogRef.current?.open()}
    >
      <HelpDialog ref={helpDialogRef} />
      <div className='cldr codicon codicon-info' />
    </Popover>
    <History />
    <TypescriptVersionStatus />
    <Popover style={{ cursor: 'pointer' }}
             offset={[0, 3]}
             content='Go to Line and Column'
             onClick={() => {
               if (!editorInstance) return

               editorInstance.focus()
               editorInstance.trigger('editor', 'editor.action.quickCommand', {})
             }}
    >
      <div className='line-and-column'>{line}:{column}</div>
    </Popover>
  </div>
}
