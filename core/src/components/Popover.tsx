import './Popover.scss'

import { useEffect, useRef, useState } from 'react'
import type { Placement } from '@popperjs/core'
import { createPopper } from '@popperjs/core/lib/popper-lite'

export interface PopoverProps {
  children: React.ReactNode
  content: React.ReactNode

  trigger?: 'click' | 'hover'
  placement?: Placement
  offset?: [number, number]

  className?: string
  contentClassName?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties

  onClick?: () => void
}

const prefix = 'ppd-popover'

export function Popover(props: PopoverProps) {
  const {
    children,
    content,
    placement = 'top',
    trigger = 'hover',
    offset = [0, 0],
    onClick,
  } = props
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
  const popper = useRef<ReturnType<typeof createPopper>>()

  useEffect(() => {
    if (referenceElement && popperElement) {
      popper.current = createPopper(referenceElement, popperElement, {
        placement,
        modifiers: [
          {
            name: 'offset',
            options: { offset }
          }
        ]
      })
    }
    return () => popper.current?.destroy()
  }, [referenceElement, popperElement, placement, offset])

  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (visible) {
      popper.current?.update()
    }
  }, [visible])
  return <div ref={setReferenceElement}
              className={
                `${prefix}-reference ${prefix}-${trigger}`
                + (props.className ? ' ' + props.className : '')
              }
              style={props.style}
              onClick={() => {
                if (trigger === 'click') {
                  setVisible(!visible)
                }
                onClick?.()
              }}
              onMouseOver={() => {
                if (trigger === 'hover') {
                  setVisible(true)
                }
              }}
              onMouseOut={() => {
                if (trigger === 'hover') {
                  setVisible(false)
                }
              }}
    >
    {children}
    <div ref={setPopperElement}
         className={
           `monaco-editor ${prefix}`
           + (props.contentClassName ? ' ' + props.contentClassName : '')
         }
         style={props.style}
         data-show={visible}
    >
      {content}
      <div className='ppd-popover-arrow' data-position={placement} />
    </div>
  </div>
}
