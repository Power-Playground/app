import React, { useContext, useEffect, useState } from 'react'

import { MonacoScopeContext } from '../EditorZone.tsx'
import { Popover } from '../Popover.tsx'

export function GoToLC() {
  const { editorInstance } = useContext(MonacoScopeContext) ?? {}

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
  return <Popover
    style={{ cursor: 'pointer' }}
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
}
