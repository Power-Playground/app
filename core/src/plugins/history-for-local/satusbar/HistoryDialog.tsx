import './HistoryDialog.scss'

import { createRef, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { DiffEditorProps, EditorProps } from '@monaco-editor/react'
import { DiffEditor, Editor } from '@monaco-editor/react'
import { classnames, messenger, scrollIntoViewIfNeeded } from '@power-playground/core'

import type { DialogRef } from '../../../components/base/Dialog'
import { Dialog } from '../../../components/base/Dialog'
import { Menu } from '../../../components/base/Menu'
import { Resizable } from '../../../components/Resizable'
import type { EditState } from '../store'
import { useLocalEditStateHistory } from '../store'

export interface HistoryDialogProps {
  code?: string
  onChange?: (codeHistory: EditState) => void
}

// TODO remove history item
// TODO configure max history length
// TODO save and load lang
// TODO set code history item name
export const HistoryDialog = forwardRef<DialogRef, HistoryDialogProps>(function HistoryDialog({ code, onChange }, ref) {
  const [theme, setTheme] = useState<string>('light')
  useEffect(() => onThemeChange(setTheme), [])

  const {
    history: _history,
    removeEditState
  } = useLocalEditStateHistory()
  function removeEditStateByTime(time: number) {
    const index = _history.findIndex(i => i.time === time)
    if (index !== -1) {
      removeEditState(index)
    }
  }

  const [input, setInput] = useState('')
  const [dateRange, setDateRange] = useState<[number, number]>([0, Date.now()])
  const historyList = useMemo(() => _history.filter(item => {
    return item.code.includes(input) && item.time >= dateRange[0] && item.time <= dateRange[1]
  }), [dateRange, _history, input])

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

  const [swipedItems, setSwipedItems] = useState<number[]>([])

  type EditorDisplayMode =
    | 'only-code'
    | 'diff-code'
    | (string & {})
  const [editorDisplayMode, setEditorDisplayMode] = useState<EditorDisplayMode>('only-code')
  const commonEditorProps = useMemo<
    DiffEditorProps & EditorProps
  >(() => ({
    height: 'calc(100% - 37px)',
    width: '100%',
    theme: theme === 'light' ? 'vs' : 'vs-dark',
    language: 'typescript',
    options: {
      readOnly: true,
      minimap: { enabled: false },
      scrollbar: { vertical: 'hidden' }
    }
  }), [theme])
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
            ref={el => {
              focusItemsRef.current[index] = el
              if (el) {
                el.addEventListener('wheel', e => {
                  if (e.deltaX !== 0) e.preventDefault()
                }, { passive: false })
              }
            }}
            key={item.time}
            className={classnames(
              'history__item',
              index === selected && 'history__item--selected',
              swipedItems.includes(index) && 'history__item--swiped'
            )}
            onClick={() => changeSelected(index)}
            onDoubleClick={() => {
              onChange?.(item)
              dialogRef.current?.hide()
            }}
            onWheel={e => {
              if (index === selected) return
              if (Math.abs(e.deltaY) > 5) return
              const unit = 100

              const delta = e.deltaX

              const _item = focusItemsRef.current[index]!
              const item = _item as typeof _item & {
                moveX?: number
                clearSwipingTimer?: number
              }
              if (Math.abs(e.deltaX) < 5 && (
                !item.classList.contains('history__item--swiping')
                || !item.classList.contains('history__item--swiped')
              )) {
                return
              }
              item.clearSwipingTimer && clearTimeout(item.clearSwipingTimer)
              if (item.moveX === undefined) {
                item.moveX = 0
              }
              item.moveX += delta
              if (item.moveX > 0) item.moveX = 0
              if (item.moveX < -unit) item.moveX = -unit
              item.style.setProperty('--swipe-start-offset-x', `${item.moveX}px`)


              if (item.moveX === 0) {
                setSwipedItems(prev => [...prev, index])

                item.classList.remove('history__item--swiping')
                return
              }
              if (item.moveX === -unit) {
                setSwipedItems(prev => prev.filter(i => i !== index))

                item.classList.remove('history__item--swiping')
                return
              }
              item.classList.add('history__item--swiping')
              item.clearSwipingTimer = setTimeout(() => {
                item.classList.remove('history__item--swiping')
              }, 100) as unknown as number
            }}
          >
            <pre className='history__item__code'>{item.code}</pre>
            <div className='history__item__time'>{new Date(item.time).toLocaleString()}</div>
            <div className='history__item__tooltip'>
              <div className='enter'>
                use by
                &nbsp;
                <kbd onClick={() => {
                  onChange?.(item)
                  dialogRef.current?.hide()
                }}>↵</kbd>
              </div>
              <div className='delete'>
                delete by
                &nbsp;
                <kbd onClick={() => {
                  removeEditStateByTime(item.time)
                }}>⌫</kbd>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Resizable>
    <div className='preview' onKeyUp={e => e.stopPropagation()}>
      <div className='toolbar'>
        <Menu
          className='view-mode-menu button'
          items={[
            {
              id: 'only-code',
              title: 'Only display code'
            },
            {
              id: 'diff-code',
              title: 'Display code diff with current code'
            }
          ]}
          onSelect={({ id }) => setEditorDisplayMode(id as any)}
          >
          👀 Change View Mode
        </Menu>
      </div>
      {editorDisplayMode === 'only-code' && <Editor
        value={history?.code ?? ''}
        {...commonEditorProps}
      />}
      {editorDisplayMode === 'diff-code' && <DiffEditor
        modified={code ?? ''}
        original={history?.code ?? ''}
        {...commonEditorProps}
      />}
    </div>
  </Dialog>
})
