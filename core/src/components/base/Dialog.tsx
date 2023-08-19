import './Dialog.scss'

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'

export interface DialogRef {
  open: () => void
  hide: () => void
}

export interface DialogProps {
  title?: React.ReactNode
  children?: React.ReactNode
  binding?: (e: KeyboardEvent) => boolean

  className?: string
  style?: React.CSSProperties & {
    '--width'?: string
    '--max-height'?: string
  }
}

const prefix = 'ppd-dialog'

export const Dialog = forwardRef<DialogRef, DialogProps>(function Dialog({
  title,
  children,
  binding,
  className,
  style
}, ref) {
  const [open, setOpen] = useState(false)
  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    hide: () => setOpen(false)
  }), [])

  useEffect(() => {
    if (!binding) return

    const handleKeyDown = (e: KeyboardEvent) => binding(e) && setOpen(true)
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [binding])

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
    autoFocus
    open={open}
    className={`${prefix} ${className ?? ''}`}
    style={style}
    >
    <div className={`${prefix}__container`}>
      <div className={`${prefix}__title`}>
        <h1>{title}</h1>
        <button className={`${prefix}__close`}
                onClick={() => setOpen(false)}
        >×</button>
      </div>
      <div className={`${prefix}__content`}>
        {open && <>{children}</>}
      </div>
    </div>
  </dialog>, document.body, 'help-dialog')
})
