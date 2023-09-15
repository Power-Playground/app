import './usePopper.scss'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Placement, VirtualElement } from '@popperjs/core'
import { createPopper } from '@popperjs/core'
import { classnames } from '@power-playground/core'
import { useDebouncedValue } from 'foxact/use-debounced-value'

export const POPPER_PREFIX = 'ppd-popper'

export interface UsePopperProps {
  referenceElement: HTMLElement | VirtualElement | null

  focusAbility?: boolean
  content: React.ReactNode
  className?: string
  style?: React.CSSProperties

  closeWhenMouseLeave?: boolean
  placement: Placement
  offset?: [number, number]
  arrowVisible?: boolean
  defaultVisible?: boolean

  onVisibleChange?: (visible: boolean) => void
  onKeydown?: (event: React.KeyboardEvent) => void
  onFocus?: (event: React.FocusEvent) => void
  onBlur?: (event: React.FocusEvent) => void
}

export const usePopper = (props: UsePopperProps) => {
  const {
    referenceElement,
    content,
    onVisibleChange, onKeydown,
    closeWhenMouseLeave,
    focusAbility = true,
    placement, offset = [0, 0],
    arrowVisible,
    defaultVisible = false
  } = props

  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)
  const [arrowPlacement, setArrowPlacement] = useState<Placement>(placement)

  const popper = useRef<ReturnType<typeof createPopper>>()

  useEffect(() => {
    if (referenceElement && popperElement) {
      popper.current = createPopper(referenceElement, popperElement, { placement })
      return () => popper.current?.destroy()
    }
  }, [referenceElement, popperElement, placement])
  useEffect(() => {
    if (popper.current) {
      popper.current.setOptions({
        placement,
        modifiers: [
          { name: 'offset', options: { offset } },
          ...(arrowElement
            ? [{ name: 'arrow', options: { element: arrowElement } }]
            : [])
        ]
      })
    }
  }, [arrowElement, offset, placement])

  const [visible, setVisible] = useState(defaultVisible)
  const changeVisible = useCallback((visible: boolean) => {
    setVisible(visible)
    onVisibleChange?.(visible)
  }, [onVisibleChange])
  useEffect(() => {
    if (visible) {
      popper.current?.update()
      setTimeout(() => {
        setArrowPlacement(popper.current?.state?.placement ?? 'top')
        focusAbility
          && setTimeout(() => popperElement?.focus(), 200)
      }, 100)
    }
  }, [popperElement, visible, focusAbility])

  const display = useDebouncedValue(visible, 200)
  const [popoverId] = useState(() => Math.random().toString(36).slice(2))
  return {
    visible,
    changeVisible,
    whenClickOtherAndHide: useCallback((event: MouseEvent) => {
      if (popperElement && !popperElement.contains(event.target as Node) && (
        !referenceElement
        || !(referenceElement instanceof HTMLElement)
        || !(referenceElement.contains(event.target as Node))
      )) {
        changeVisible(false)
      }
    }, [changeVisible, popperElement, referenceElement]),
    popper: (
      visible ? true : display
    ) && createPortal(<div
      tabIndex={focusAbility ? 0 : undefined}
      ref={setPopperElement}
      className={classnames(POPPER_PREFIX, 'monaco-editor', props.className)}
      data-show={!visible ? false : display}
      onMouseOver={() => {
        if (closeWhenMouseLeave) {
          changeVisible(true)
        }
      }}
      onMouseOut={() => {
        if (closeWhenMouseLeave) {
          changeVisible(false)
        }
      }}
      onKeyDown={event => {
        onKeydown?.(event)
        if (event.key === 'Escape') {
          changeVisible(false)
          event.stopPropagation()
        }
      }}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      >
      {content}
      {arrowVisible && <div
        ref={setArrowElement}
        className={`${POPPER_PREFIX}-arrow`}
        data-position={arrowPlacement}
      />}
    </div>, document.body, `popper-${popoverId}`)
  }
}

export const createPointVEle = (x: number, y: number): VirtualElement => ({
  getBoundingClientRect: () => ({
    y: y,
    x: x,
    top: y,
    left: x,
    bottom: y,
    right: x,
    width: 0,
    height: 0,
    toJSON: () => ({})
  })
})

