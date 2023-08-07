import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'

import type { DialogRef } from '../Dialog.tsx'


export const HelpDialog = forwardRef<DialogRef>(function HelpDialog({ }, ref) {
  const [open, setOpen] = useState(false)
  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    hide: () => setOpen(false)
  }), [])

  const isMac = navigator.platform.includes('Mac')
  const cmdOrCtrl = isMac ? '⌘' : 'Ctrl'
  const ctrl = isMac ? '⌃' : 'Ctrl'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  useEffect(() => {
    if (open) {
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false)
      }
      document.addEventListener('keyup', handleKeyUp)
      return () => document.removeEventListener('keyup', handleKeyUp)
    }
  }, [open])
  return createPortal(<dialog
    className='help'
    autoFocus
    open={open}
    >
    <div className='dialog__container'>
      <div className='dialog__title'>
        <h1>帮助</h1>
        <button className='dialog__close' onClick={() => setOpen(false)}>×</button>
      </div>
      <div className='dialog__content'>
        <h2>快捷键</h2>
        <ul>
          <li><code>{cmdOrCtrl} + S</code>: 保存并复制链接</li>
          <li><code>{cmdOrCtrl} + E</code>: 执行代码</li>
          <li><code>{cmdOrCtrl} + H</code>: 历史代码（{cmdOrCtrl} + S 保存下来的代码）</li>
          <li><code>{ctrl} + /</code>: 查看帮助</li>
        </ul>
        <h2>支持的语言</h2>
        <ul>
          <li><code>JavaScript</code></li>
          <li><code>TypeScript</code></li>
        </ul>
      </div>
    </div>
  </dialog>, document.body, 'help-dialog')
})
