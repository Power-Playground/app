import React, { useEffect, useMemo, useState } from 'react'

import type { UsePopperProps } from '../../hooks/usePopper'
import { usePopper } from '../../hooks/usePopper'

export interface TooltipProps extends Omit<UsePopperProps,
  | 'content'
  | 'referenceElement'
  | 'placement'
> {
  content?: React.ReactNode
  contentText?: string
  contentPlaceholder?: React.ReactNode
  children: React.ReactNode
  trigger?: 'hover' | 'always'
  placement?: UsePopperProps['placement']
  onMouseEnter?: (event: React.MouseEvent) => void
  onMouseLeave?: (event: React.MouseEvent) => void
}

Tooltip.prefix = 'ppd-tooltip'
export function Tooltip(props: TooltipProps) {
  const { prefix } = Tooltip
  const {
    trigger = 'hover',
    content,
    contentText,
    contentPlaceholder,
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
  if (contentText && contentPlaceholder && content) {
    throw new Error('Tooltip component must have only one content')
  }
  const computeContent = useMemo(() => {
    if (contentText) {
      return <span>
        {contentText}
        {contentPlaceholder && <>
          {contentText.length > 20 ? <br /> : ' '}
          <span className={`${prefix}-placeholder`}>{contentPlaceholder}</span>
        </>}
      </span>
    }
    return content
  }, [contentText, content, contentPlaceholder, prefix])
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const { popper, changeVisible } = usePopper({
    referenceElement,
    content: computeContent,
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
