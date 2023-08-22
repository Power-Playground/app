import './Popover.scss'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Placement } from '@popperjs/core'
import { createPopper } from '@popperjs/core'

export interface PopoverProps {
  tabIndex?: number
  children: React.ReactNode
  content: React.ReactNode

  trigger?: 'click' | 'hover' | 'always'
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
    onClick
  } = props
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null)
  const [arrowPlacement, setArrowPlacement] = useState<Placement>(placement)
  const popper = useRef<ReturnType<typeof createPopper>>()

  useEffect(() => {
    if (referenceElement && popperElement) {
      popper.current = createPopper(referenceElement, popperElement, { placement })
      return () => popper.current?.destroy()
    }
  }, [referenceElement, popperElement, placement, offset])
  useEffect(() => {
    if (popper.current && arrowElement) {
      popper.current.setOptions({
        placement,
        modifiers: [
          { name: 'offset', options: { offset } },
          { name: 'arrow', options: { element: arrowElement } }
        ]
      })
    }
  }, [arrowElement, offset, placement])

  const [visible, setVisible] = useState(false)
  function clickOther(event: MouseEvent) {
    if (event.target instanceof HTMLElement) {
      if (!event.target.closest(
        `.${prefix}, .${prefix}-reference`
      )) {
        setVisible(false)
        removeEventListener('click', clickOther)
      }
    }
  }
  useEffect(() => {
    if (trigger === 'always') {
      setVisible(true)
    }
  }, [trigger])
  useEffect(() => {
    if (visible) {
      popper.current?.update()
      setArrowPlacement(popper.current?.state?.placement ?? 'top')
    }
  }, [visible])
  const classname = `${prefix}-reference ${prefix}-${trigger}`
    + (props.className ? ' ' + props.className : '')

  const [popoverId] = useState(Math.random().toString(36).slice(2))
  const isFocus = useRef(false)
  return <>
    <div
      ref={setReferenceElement}
      tabIndex={props.tabIndex}
      className={classname}
      style={props.style}
      onClick={() => {
        if (trigger === 'click') {
          if (isFocus.current) {
            isFocus.current = false
            return
          }
          if (!visible && props.tabIndex !== undefined) {
            addEventListener('click', clickOther)
          }
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
      onFocus={() => {
        if (props.tabIndex !== undefined) {
          if (!visible) {
            addEventListener('click', clickOther)
          }
          isFocus.current = true
          setVisible(true)
        }
      }}
      onBlur={event => {
        if (props.tabIndex !== undefined) {
          if (event.relatedTarget instanceof HTMLElement) {
            if (event.relatedTarget.closest(
              `.${prefix}, .${prefix}-reference`
            )) return
          }
          setVisible(false)
        }
      }}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          if (trigger === 'click') {
            setVisible(!visible)
          }
          onClick?.()
        }
        if (event.key === 'Escape') {
          setVisible(false)
          event.stopPropagation()
        }
      }}
      >
      {children}
    </div>
    {createPortal(<div
      ref={setPopperElement}
      className={
        `monaco-editor ${prefix}`
        + (props.contentClassName ? ' ' + props.contentClassName : '')
      }
      data-show={visible}
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
      onKeyDown={event => {
        if (event.key === 'Escape') {
          setVisible(false)
          event.stopPropagation()
        }
      }}
      >
      {content}
      <div
        ref={setArrowElement}
        className={`${prefix}-arrow`}
        data-position={arrowPlacement}
      />
    </div>, document.body, `popover-${popoverId}`)}
  </>
}
