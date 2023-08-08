import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Editor from '@monaco-editor/react'

import type { CodeHistoryItem } from './historyStore.ts'
import { useCodeHistory } from './historyStore.ts'
import type { DialogRef } from '../Dialog.tsx'

export const HistoryDialog = forwardRef<DialogRef, {
  theme: string
  onChange?: (codeHistory: CodeHistoryItem) => void
    }>(function HistoryDialog({ theme, onChange }, ref) {
      const [open, setOpen] = useState(false)
      useImperativeHandle(ref, () => ({
        open: () => setOpen(true),
        hide: () => setOpen(false)
      }), [])

      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          // cmd/ctrl + h
          if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
            setOpen(true)
          }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
      }, [])

      const [historyList, dispatch] = useCodeHistory()
      const [selected, setSelected] = useState(0)
      const history = useMemo(() => historyList[selected], [historyList, selected])
      // TODO auto scroll
      // TODO remove history item
      // TODO configure max history length
      // TODO save and load lang
      // TODO set code history item name
      useEffect(() => {
        if (open) {
          const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
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
              setOpen(false)
            }
          }
          document.addEventListener('keyup', handleKeyUp)
          return () => document.removeEventListener('keyup', handleKeyUp)
        }
      }, [history, historyList.length, onChange, open])
      return createPortal(<dialog
    className='history'
    autoFocus
    open={open}
        >
        <div className='dialog__container'>
          <div className='dialog__title'>
            <h5>
              历史记录
            </h5>
            <span><code>↑/↓</code>(选择)</span>
            <span><code>Enter</code>(确认)</span>
            <button className='dialog__close' onClick={() => setOpen(false)}>×</button>
          </div>
          {open && <div className='dialog__content'>
            <div className='history__list'>
              {historyList.map((item, index) => (
                <div
              key={item.time}
              className={'history__item'
                + (index === selected ? ' history__item--selected' : '')}
              onClick={() => setSelected(index)}
            >
                  <pre className='history__item__code'>{item.code}</pre>
                  <div className='history__item__time'>{new Date(item.time).toLocaleString()}</div>
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
          </div>}
        </div>
      </dialog>, document.body, 'history-dialog')
    })
