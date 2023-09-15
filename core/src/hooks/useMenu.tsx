import './useMenu.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ListItem, ListRef } from '../components/base/List'
import { List } from '../components/base/List'

import { useDocumentEventListener } from './useDocumentEventListener'
import type { UsePopperProps } from './usePopper'
import { usePopper } from './usePopper'

export class StopMenuTriggerError extends Error {}

export interface MenuItem extends ListItem {
  children?: ListItem[]
}

export interface UseMenuProps {
  noArrow?: boolean
  offset?: [number, number]
  defaultVisible?: boolean
  defaultFocusIndex?: number
  defaultSelectedIds?: string[]

  onTrigger?: (item: MenuItem) => void | Promise<void>
}

export function useMenu(
  ref: UsePopperProps['referenceElement'],
  items: MenuItem[],
  props?: UseMenuProps
) {
  const memoItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      placeholder: item.placeholder
        ? item.placeholder
        : item.children
          ? <span className='cldr codicon codicon-chevron-right' />
          : undefined
    }))
  }, [items])
  const {
    noArrow = false,
    offset = [0, 6],
    defaultVisible = false,
    defaultFocusIndex,
    defaultSelectedIds,
    onTrigger
  } = props ?? {}
  const listRef = useRef<ListRef>(null)
  const childrenListRef = useRef<ListRef>(null)

  const [activator, setActivator] = useState<[MenuItem, HTMLElement | null] | null>(null)
  const [activeItem, activeElem] = activator ?? []
  const childrenIsVisible = useMemo(() => {
    return !!(activeItem?.children && activeElem)
  }, [activeItem, activeElem])

  const rt = usePopper({
    referenceElement: items.length > 0 ? ref : null,
    placement: 'bottom-start',
    arrowVisible: !noArrow,
    focusAbility: false,
    offset,
    defaultVisible,
    className: 'ppd-menu2',
    content: <List
      hideTip
      ref={listRef}
      items={memoItems}
      defaultFocusIndex={defaultFocusIndex}
      defaultSelectedIds={defaultSelectedIds}
      onClickItem={async (ref, item, type, event) => {
        if (type === 'click') {
          try {
            event.preventDefault()
            event.stopPropagation()
            await trigger(ref, item)
          } catch (e) {
            if (e instanceof StopMenuTriggerError) {
              return
            }
            throw e
          }
        }
      }}
      onItemKeyDown={async (ref, item, event) => {
        async function innerTrigger(closeWhenTrigger?: boolean) {
          try {
            event.preventDefault()
            event.stopPropagation()
            await trigger(ref, item, closeWhenTrigger)
          } catch (e) {
            if (e instanceof StopMenuTriggerError) {
              return
            }
            throw e
          }
        }
        if (event.key === 'Enter') {
          await innerTrigger()
          return false
        }
        if (event.key === ' ') {
          await innerTrigger(false)
          return false
        }
        // TODO https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#:~:text=in%20the%20submenu.-,Right%20Arrow,-%3A
        if (event.key === 'ArrowRight' && item.children) {
          await innerTrigger()
          return false
        }
      }}
    />,
    onVisibleChange: useCallback((v: boolean) => {
      if (v) {
        setTimeout(() => listRef.current?.focus(), 300)
      } else {
        if (ref instanceof HTMLElement) {
          ref.focus()
        }
      }
    }, [ref])
  })
  const childrenMenu = usePopper({
    referenceElement: rt.visible && childrenIsVisible ? (activeElem ?? null) : null,
    placement: 'right-start',
    focusAbility: false,
    offset: [0, 4],
    className: 'ppd-menu2',
    content: rt.visible && childrenIsVisible ? <List
      hideTip
      ref={childrenListRef}
      items={activeItem?.children ?? []}
      onClickItem={async (ref, item, type, event) => {
        if (type === 'click') {
          await trigger(null, item)
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      onKeyDown={async (event) => {
        if (event.key === 'ArrowLeft') {
          listRef.current?.focus()
          childrenMenu.changeVisible(false)
          event.preventDefault()
          event.stopPropagation()
          return false
        }
        if (event.key === 'Escape') {
          rt.changeVisible(false)
          event.preventDefault()
          event.stopPropagation()
          return false
        }
      }}
      onItemKeyDown={async (ref, item, event) => {
        if (event.key === 'Enter') {
          await trigger(null, item)
          event.preventDefault()
          event.stopPropagation()
          return false
        }
        if (event.key === 'ArrowLeft') {
          listRef.current?.focus()
          childrenMenu.changeVisible(false)
          event.preventDefault()
          event.stopPropagation()
          return false
        }
      }}
    /> : null,
    onVisibleChange: useCallback((v: boolean) => {
      if (v) {
        setTimeout(() => childrenListRef.current?.focus(), 300)
      }
    }, [])
  })

  const trigger = useCallback(async (
    ref: HTMLElement | null,
    item: MenuItem,
    closeWhenTrigger = true
  ) => {
    let error: Error | unknown | undefined
    try {
      ref && setActivator([item, ref])
      if (!item?.children) {
        await onTrigger?.(item)
      } else {
        childrenMenu.changeVisible(true)
        throw new StopMenuTriggerError()
      }
    } catch (e) {
      error = e
    }
    if (!(error instanceof StopMenuTriggerError)) {
      closeWhenTrigger && rt.changeVisible(false)
      return
    }
    throw error
  }, [childrenMenu, onTrigger, rt])
  useEffect(() => {
    if (!rt.visible) {
      setActivator(null)
      childrenMenu.changeVisible(false)
    }
  }, [childrenMenu, rt.visible])
  useEffect(() => {
    if (!activeItem?.children && childrenMenu.visible) {
      childrenMenu.changeVisible(false)
    }
  }, [activeItem?.children, childrenMenu])

  useDocumentEventListener('click', rt.whenClickOtherAndHide)

  return {
    ...rt,
    popper: <>
      {rt.popper}
      {childrenMenu.popper}
    </>
  }
}
