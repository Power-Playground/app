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

  content: React.ReactNode
  className?: string
  style?: React.CSSProperties

  closeWhenMouseLeave?: boolean
  placement: Placement
  offset?: [number, number]
  arrowVisible?: boolean

  onVisibleChange?: (visible: boolean) => void
  onKeydown?: (event: React.KeyboardEvent) => void
}

export const usePopper = (props: UsePopperProps) => {
  const {
    referenceElement,
    content,
    onVisibleChange, onKeydown,
    closeWhenMouseLeave,
    placement, offset = [0, 0],
    arrowVisible
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
  const changeVisible = useCallback((visible: boolean) => {
    setVisible(visible)
    onVisibleChange?.(visible)
  }, [onVisibleChange])
  useEffect(() => {
    if (visible) {
      popper.current?.update()
      setTimeout(() => {
        setArrowPlacement(popper.current?.state?.placement ?? 'top')
        setTimeout(() => popperElement?.focus(), 200)
      }, 100)
    }
  }, [popperElement, visible])

  const display = useDebouncedValue(visible, 200)
  const [popoverId] = useState(() => Math.random().toString(36).slice(2))
  return {
    visible,
    changeVisible,
    clickOther: useCallback((event: MouseEvent) => {
      if (popperElement && !popperElement.contains(event.target as Node)) {
        changeVisible(false)
      }
    }, [changeVisible, popperElement]),
    popper: (
      visible ? true : display
    ) && createPortal(<div
      tabIndex={0}
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
