import './HistoryDialog.scss'

import { createRef, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { messenger } from '@power-playground/core'

import type { DialogRef } from '../../../components/base/Dialog'
import { Dialog } from '../../../components/base/Dialog'
import { Resizable } from '../../../components/Resizable'
import { scrollIntoViewIfNeeded } from '../../../utils/scrollIntoViewIfNeeded.ts'

import type { CodeHistoryItem } from './historyStore'
import { useCodeHistory } from './historyStore'

export interface HistoryDialogProps {
  onChange?: (codeHistory: CodeHistoryItem) => void
}

// TODO auto scroll
// TODO remove history item
// TODO configure max history length
// TODO save and load lang
// TODO set code history item name
export const HistoryDialog = forwardRef<DialogRef, HistoryDialogProps>(function HistoryDialog({ onChange }, ref) {
  const [theme, setTheme] = useState<string>('light')
  useEffect(() => onThemeChange(setTheme), [])

  const [_historyList, dispatch] = useCodeHistory()

  const [input, setInput] = useState('')
  const [dateRange, setDateRange] = useState<[number, number]>([0, Date.now()])
  const historyList = useMemo(() => _historyList.filter(item => {
    return item.code.includes(input) && item.time >= dateRange[0] && item.time <= dateRange[1]
  }), [dateRange, _historyList, input])

  const focusItemsRef = useRef<(HTMLDivElement | null)[]>([])

  const dialogRef = createRef<DialogRef>()
  const [selected, setSelected] = useState(0)
  const changeSelected = useCallback<typeof setSelected>(arg0 => {
    const scope = 1
    setSelected(prevIndex => {
      const nextIndex = typeof arg0 === 'function' ? arg0(prevIndex) : arg0
      scrollIntoViewIfNeeded(focusItemsRef.current[
        nextIndex > prevIndex
          ? Math.min(nextIndex + scope, historyList.length - 1)
          : Math.max(nextIndex - scope, 0)
      ])
      return nextIndex
    })
  }, [historyList.length])
  const [up, dn] = [
    useCallback(() => {
      changeSelected(selected => (selected + historyList.length - 1) % historyList.length)
    }, [changeSelected, historyList]),
    useCallback(() => {
      changeSelected(selected => (selected + 1) % historyList.length)
    }, [changeSelected, historyList])
  ]
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
    </>}
    binding={e => e.key === 'h' && (e.metaKey || e.ctrlKey)}
    handleKeyUpOnOpen={(e, dialog) => {
      // alt + up
      if (e.key === 'ArrowUp' && e.ctrlKey) {
        changeSelected(0)
      }
      // alt + down
      if (e.key === 'ArrowDown' && e.ctrlKey) {
        changeSelected(historyList.length - 1)
      }
      if (e.key === 'Enter') {
        onChange?.(history)
        dialog?.hide?.()
      }
      if (e.key === 'Backspace') {
        // TODO remove history item
        messenger.then(m => m.display('warning', 'Not implemented yet'))
      }
    }}
    handleKeyDownOnOpen={e => {
      if (e.key === 'ArrowUp') up()
      if (e.key === 'ArrowDown') dn()
    }}
    >
    <Resizable
      className='history__list'
      style={{
        width: '45%',
        minWidth: '40%',
        maxWidth: '80%',
        '--inner-border-width': '1px'
      }}
      resizable={{ right: true }}
    >
      <div className='ppd-search-box' onKeyUp={e => e.stopPropagation()}>
        <span className='opts'>
          <button onClick={up}
                  onDoubleClick={() => changeSelected(0)}>
            <kbd>↑</kbd>
          </button>
          <button onClick={dn}
                  onDoubleClick={() => changeSelected(historyList.length - 1)}>
            <kbd>↓</kbd>
          </button>
        </span>
        <input
          type='text'
          placeholder='Search by code content'
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <span className='opts'>
          <input
            type='date'
            value={new Date(dateRange[0]).toISOString().slice(0, 10)}
            onChange={e => setDateRange([new Date(e.target.value).getTime(), dateRange[1]])}
          />
          <input
            type='date'
            value={new Date(dateRange[1]).toISOString().slice(0, 10)}
            onChange={e => setDateRange([dateRange[0], new Date(e.target.value).getTime()])}
          />
        </span>
      </div>
      <div className='history__list-items'>
        {/* TODO Refactor by virtual list */}
        {historyList.map((item, index) => (
          <div
            ref={el => focusItemsRef.current[index] = el}
            key={item.time}
            className={'history__item'
              + (index === selected ? ' history__item--selected' : '')}
            onClick={() => changeSelected(index)}
            onDoubleClick={() => {
              onChange?.(item)
              dialogRef.current?.hide()
            }}
          >
            <pre className='history__item__code'>{item.code}</pre>
            <div className='history__item__time'>{new Date(item.time).toLocaleString()}</div>
            <div className='history__item__tooltip'>
              <div className='enter'>
                use by <kbd>↵</kbd>
              </div>
              <div className='delete'>
                delete by <kbd>⌫</kbd>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Resizable>
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
