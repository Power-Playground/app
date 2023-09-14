import './useMenu.scss'

import { useCallback, useRef } from 'react'

import type { ListItem, ListRef } from '../components/base/List'
import { List } from '../components/base/List'

import { useDocumentEventListener } from './useDocumentEventListener'
import type { UsePopperProps } from './usePopper'
import { usePopper } from './usePopper'

export interface UseMenuProps {
  onTrigger?: (item: ListItem) => void | Promise<void>
}

export class StopMenuTriggerError extends Error {}

export function useMenu(
  ref: UsePopperProps['referenceElement'],
  items: ListItem[],
  props?: UseMenuProps
) {
  const {
    onTrigger
  } = props ?? {}
  const listRef = useRef<ListRef>(null)
  const rt = usePopper({
    referenceElement: items.length > 0 ? ref : null,
    placement: 'bottom-start',
    arrowVisible: true,
    focusAbility: false,
    offset: [0, 6],
    className: 'ppd-menu2',
    content: <List
      hideTip
      ref={listRef}
      items={items}
      onClickItem={async (item, type, event) => {
        if (type === 'click') {
          await trigger(item)
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      onItemKeyDown={async (item, event) => {
        if (event.key === 'Enter') {
          await trigger(item)
          event.preventDefault()
          event.stopPropagation()
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
  const trigger = useCallback(async (item: ListItem) => {
    let error: Error | unknown | undefined
    try {
      await onTrigger?.(item)
    } catch (e) {
      error = e
    }
    if (!(error instanceof StopMenuTriggerError)) {
      rt.changeVisible(false)
      return
    }
    throw error
  }, [onTrigger, rt])
  useDocumentEventListener('click', rt.whenClickOtherAndHide)
  return rt
}
