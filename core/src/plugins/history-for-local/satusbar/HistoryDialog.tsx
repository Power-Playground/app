import './HistoryDialog.scss'

import { createRef, forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'

import type { DialogRef } from '../../../components/base/Dialog'
import { Dialog } from '../../../components/base/Dialog'

import type { CodeHistoryItem } from './historyStore'
import { useCodeHistory } from './historyStore'

export interface HistoryDialogProps {
  theme: string
  onChange?: (codeHistory: CodeHistoryItem) => void
}

// TODO auto scroll
// TODO remove history item
// TODO configure max history length
// TODO save and load lang
// TODO set code history item name
export const HistoryDialog = forwardRef<DialogRef, HistoryDialogProps>(function HistoryDialog({ theme, onChange }, ref) {
  const dialogRef = createRef<DialogRef>()
  const [historyList, dispatch] = useCodeHistory()
  const [selected, setSelected] = useState(0)
  const history = useMemo(() => historyList[selected], [historyList, selected])
  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.open(),
    hide: () => dialogRef.current?.hide()
  }), [dialogRef])
  return <Dialog
    ref={dialogRef}
    className='history'
    style={{
      '--width': '80vw'
    }}
    title={<>
      History
      &nbsp;&nbsp;
      <span><code>↑/↓</code>(选择)</span>
    </>}
    binding={e => e.key === 'h' && (e.metaKey || e.ctrlKey)}
    handleKeyUpOnOpen={(e, dialog) => {
      // up
      if (e.key === 'ArrowUp') {
        setSelected(selected => (selected + historyList.length - 1) % historyList.length)
      }
      // down
      if (e.key === 'ArrowDown') {
        setSelected(selected => (selected + 1) % historyList.length)
      }
      // enter
      if (e.key === 'Enter') {
        onChange?.(history)
        dialog?.hide?.()
      }
    }}
    >
    <div className='history__list'>
      {/* TODO Refactor by virtual list */}
      {historyList.map((item, index) => (
        <div
          key={item.time}
          className={'history__item'
            + (index === selected ? ' history__item--selected' : '')}
          onClick={() => setSelected(index)}
          onDoubleClick={() => {
            onChange?.(item)
            dialogRef.current?.hide()
          }}
        >
          <pre className='history__item__code'>{item.code}</pre>
          <div className='history__item__time'>{new Date(item.time).toLocaleString()}</div>
          <div className='history__item__enter-tooltip'><kbd>↵</kbd>&nbsp;&nbsp;to use</div>
        </div>
      ))}
    </div>
    <div className='preview'>
      <Editor
        height='100%'
        width='100%'
        theme={theme === 'light' ? 'vs' : 'vs-dark'}
        language='javascript'
        value={history?.code ?? ''}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollbar: { vertical: 'hidden' }
        }}
      />
    </div>
  </Dialog>
})
