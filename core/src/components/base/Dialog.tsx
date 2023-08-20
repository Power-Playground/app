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
  handleKeyUpOnOpen?: (e: KeyboardEvent, ref?: DialogRef) => void

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
  handleKeyUpOnOpen,
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

        handleKeyUpOnOpen?.(e, {
          open: () => setOpen(true),
          hide: () => setOpen(false)
        })
      }
      document.addEventListener('keyup', handleKeyUp)
      return () => document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyUpOnOpen, open])
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
  </dialog>, document.body, `dialog-${
    useState(() => Math.random().toString(36).slice(2))[0]
  }`)
})
