import './Dialog.scss'

import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useDocumentEventListener } from '../../hooks/useDocumentEventListener'

export interface DialogRef {
  open: () => void
  hide: () => void
}

export interface DialogProps {
  title?: React.ReactNode
  children?: React.ReactNode
  binding?: (e: KeyboardEvent) => boolean
  handleKeyUpOnOpen?: (e: React.KeyboardEvent<HTMLDivElement>, ref?: DialogRef) => void
  handleKeyDownOnOpen?: (e: React.KeyboardEvent<HTMLDivElement>, ref?: DialogRef) => void

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
  handleKeyDownOnOpen,
  className,
  style
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const openActiveElement = useRef<HTMLElement | null>(null)
  const toggle = useCallback((v?: boolean) =>{
    setOpen(open => {
      const nv = v ?? !open
      if (nv) {
        openActiveElement.current = document.activeElement as HTMLElement
        setTimeout(() => containerRef.current?.focus({
          preventScroll: true
        }), 300)
      } else {
        openActiveElement.current?.focus()
      }
      return nv
    })
  }, [])
  useImperativeHandle(ref, () => ({
    open: () => toggle(true),
    hide: () => toggle(false)
  }), [toggle])
  useDocumentEventListener('keydown', e => {
    if (binding?.(e)) {
      toggle(true)
      e.stopPropagation()
      e.preventDefault()
    }
  })
  return createPortal(<dialog
    open={open}
    className={`${prefix} ${className ?? ''}`}
    style={style}
    onClick={e => {
      if (e.target === e.currentTarget) toggle(false)
    }}
    >
    <div
      tabIndex={0}
      ref={containerRef}
      className={`${prefix}__container`}
      onKeyUp={e => {
        if (!open) return
        handleKeyUpOnOpen?.(e, {
          open: () => toggle(true),
          hide: () => toggle(false)
        })
      }}
      onKeyDown={e => {
        if (!open) return
        if (e.key === 'Escape') {
          toggle(false)
          e.stopPropagation()
          e.preventDefault()
          return
        }
        handleKeyDownOnOpen?.(e, {
          open: () => toggle(true),
          hide: () => toggle(false)
        })
      }}
    >
      {title && <div className={`${prefix}__title`}>
        <h1>{title}</h1>
      </div>}
      <div className={`${prefix}__content`}>
        {open && <>{children}</>}
      </div>
    </div>
  </dialog>, document.body, `dialog-${
    useState(() => Math.random().toString(36).slice(2))[0]
  }`)
})
