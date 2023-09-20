import './Popover.scss'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { UsePopperProps } from '../../hooks/usePopper'
import { POPPER_PREFIX, usePopper } from '../../hooks/usePopper'

export interface PopoverProps extends Pick<
  UsePopperProps,
    | 'offset'
    | 'onVisibleChange'
    | 'onKeydown'
> {
  tabIndex?: number
  children: React.ReactNode
  content: React.ReactNode

  placement?: UsePopperProps['placement']
  trigger?: 'click' | 'hover' | 'always'

  className?: string
  contentClassName?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties

  onClick?: () => void
}

export interface PopoverRef {
  open: () => void
  hide: () => void
}

const prefix = 'ppd-popover'

export const Popover = forwardRef<PopoverRef, PopoverProps>(function Popover(props, ref) {
  const {
    children,
    content,
    placement = 'top',
    trigger = 'hover',
    offset = [0, 0],
    onClick
  } = props
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const {
    popper,
    visible, changeVisible
  } = usePopper({
    content,
    className: props.contentClassName, style: props.contentStyle,
    referenceElement,
    placement, offset,
    closeWhenMouseLeave: trigger === 'hover',
    onVisibleChange: props.onVisibleChange,
    onKeydown: props.onKeydown,
    arrowVisible: true
  })
  useEffect(() => {
    if (trigger === 'always') changeVisible(true)
  }, [changeVisible, trigger])

  function clickOther(event: MouseEvent) {
    if (event.target instanceof HTMLElement) {
      if (!event.target.closest(
        `.${POPPER_PREFIX}, .${prefix}-reference`
      )) {
        changeVisible(false)
        removeEventListener('click', clickOther)
      }
    }
  }
  const classname = `${prefix}-reference ${prefix}-${trigger}`
    + (props.className ? ' ' + props.className : '')

  const isFocus = useRef(false)

  useImperativeHandle(ref, () => ({
    open: () => changeVisible(true),
    hide: () => changeVisible(false)
  }), [changeVisible])
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
          changeVisible(!visible)
        }
        onClick?.()
      }}
      onMouseOver={() => {
        if (trigger === 'hover') {
          changeVisible(true)
        }
      }}
      onMouseOut={() => {
        if (trigger === 'hover') {
          changeVisible(false)
        }
      }}
      onFocus={() => {
        if (props.tabIndex !== undefined) {
          if (!visible) {
            addEventListener('click', clickOther)
          }
          isFocus.current = true
          changeVisible(true)
        }
      }}
      onBlur={e => {
        if (props.tabIndex !== undefined) {
          if (e.relatedTarget instanceof HTMLElement) {
            if (e.relatedTarget.closest(
              `.${POPPER_PREFIX}, .${prefix}-reference`
            )) return
          }
          changeVisible(false)
        }
      }}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          if (trigger === 'click') {
            changeVisible(!visible)
          }
          onClick?.()
        }
        if (event.key === 'Escape') {
          changeVisible(false)
          event.stopPropagation()
        }
      }}
      >
      {children}
    </div>
    {popper}
  </>
})
