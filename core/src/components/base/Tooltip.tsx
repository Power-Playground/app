import React, { useEffect, useState } from 'react'

import type { UsePopperProps } from '../../hooks/usePopper'
import { usePopper } from '../../hooks/usePopper'

export interface TooltipProps extends Omit<UsePopperProps,
  | 'referenceElement'
  | 'placement'
> {
  children: React.ReactNode
  trigger?: 'hover' | 'always'
  placement?: UsePopperProps['placement']
  onMouseEnter?: (event: React.MouseEvent) => void
  onMouseLeave?: (event: React.MouseEvent) => void
}

export function Tooltip(props: TooltipProps) {
  const {
    trigger = 'hover',
    children,
    onMouseEnter,
    onMouseLeave,
    ...popperProps
  } = props
  if (React.Children.count(children) !== 1) {
    throw new Error('Tooltip component must have only one child')
  }
  if (!React.isValidElement(children)) {
    throw new Error('Tooltip component must have only one valid child')
  }
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const { popper, changeVisible } = usePopper({
    referenceElement,
    arrowVisible: true,
    placement: 'top',
    ...popperProps
  })
  useEffect(() => {
    if (trigger === 'always') {
      changeVisible?.(true)
    }
  }, [changeVisible, trigger])
  return <>
    {popper}
    {React.cloneElement(children, {
      // @ts-ignore
      ref: (element: HTMLElement | null) => {
        setReferenceElement(element)
        const { ref } = children as any
        if (typeof ref === 'function') {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      },
      onMouseEnter: (e: React.MouseEvent) => {
        if (trigger === 'hover') {
          changeVisible?.(true)
        }
        onMouseEnter?.(e)
      },
      onMouseLeave: (e: React.MouseEvent) => {
        if (trigger === 'hover') {
          changeVisible?.(false)
        }
        onMouseLeave?.(e)
      }
    })}
  </>
}
