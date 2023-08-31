import './Menu.scss'

import { useRef, useState } from 'react'
import { classnames, scrollIntoViewIfNeeded } from '@power-playground/core'

import type { PopoverRef } from '../base/Popover'
import { Popover } from '../base/Popover'

export interface MenuItem {
  id: string
  title?: string
  content?: React.ReactNode
}

export interface MenuProps {
  style?: React.CSSProperties
  className?: string
  children: React.ReactNode
  items: (MenuItem | string | 'slider')[]
  onSelect?: (item: MenuItem) => void
  closeWhenSelect?: boolean
}

const prefix = 'ppd-menu'

export function Menu(props: MenuProps) {
  const {
    items,
    onSelect,
    closeWhenSelect = true
  } = props
  const popoverRef = useRef<PopoverRef>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const focusIndexRef = useRef(activeIndex)
  const menuItemsRef = useRef<HTMLDivElement[]>([])
  function select(item: MenuItem, index: number) {
    focusIndexRef.current = index
    setActiveIndex(index)
    onSelect?.(item)
    closeWhenSelect && popoverRef.current?.hide()
  }
  return <Popover
    ref={popoverRef}
    tabIndex={0}
    style={props.style}
    className={props.className}
    trigger='click'
    placement='bottom-start'
    offset={[0, 5]}
    onKeydown={e => {
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.stopPropagation()
        e.preventDefault()
        const scope = 1
        const nextIndex = focusIndexRef.current + (e.key === 'ArrowDown' ? 1 : -1)
        focusIndexRef.current = Math.max(0, Math.min(nextIndex, items.length - 1))
        scrollIntoViewIfNeeded(menuItemsRef.current[
          focusIndexRef.current > nextIndex
            ? Math.max(nextIndex - scope, 0)
            : Math.min(nextIndex + scope, items.length - 1)
        ])
        menuItemsRef.current[focusIndexRef.current].focus()
      }
    }}
    onVisibleChange={v => {
      if (v) {
        setTimeout(() => {
          menuItemsRef.current[focusIndexRef.current].focus()
        }, 30)
      }
    }}
    content={
      <div className={prefix}>
        {items.map((item, i) => {
          if (item === 'slider') {
            return <div key={i} className={`${prefix}-slider`} />
          }
          function sel() {
            if (typeof item === 'string') {
              select({ id: item, title: item }, i)
            } else {
              select(item, i)
            }
          }
          const {
            title, children
          } = typeof item === 'string' ? {
            title: item,
            children: item
          } : {
            title: item.title ?? item.id,
            children: item.content ?? item.title ?? item.id
          }
          return <div
            ref={el => menuItemsRef.current[i] = el!}
            tabIndex={0}
            key={i}
            className={classnames(
              `${prefix}-item`,
              activeIndex === i && `${prefix}-item__active`
            )}
            title={title}
            onClick={sel}
            onKeyDown={e => {
              if (e.key === 'Enter') sel()
            }}
          >
            {children}
          </div>
        })}
      </div>
    }
    >
    {props.children}
  </Popover>
}
