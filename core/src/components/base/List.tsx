import './List.scss'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRetimer } from 'foxact/use-retimer'

import { classnames, isMacOS } from '../../utils'

import { forwardRefWithStatic } from './forwardRefWithStatic'

export interface ListItem {
  icon?: string | React.ReactNode
  id: string
  label: string
  content?: React.ReactNode | ((keyword: string, item: ListItem) => React.ReactNode)
  placeholder?: string | React.ReactNode

  disabled?: boolean
}
export interface ListProps {
  selectable?: boolean
}
export interface ListRef {
}

enum KeyMapUnicodeEmoji {
  Windows = '❖',
  Control = '^',
  Option = '⌥',
  Command = '⌘',
  Shift = '⇧',
  Backspace = '⌫',
  Delete = '⌦',
  Return = '⏎',
  Escape = '⎋',
  Clear = '⌧',
  Eject = '⌽',
  Power = '⏏',
  ContextMenu = '⌶',
  Space = '␣',
  Execute = '⎄',
  Enter = '⌤',
  Insert = '⌅',
  Tab = '⇥',
  PageUp = '⇞',
  PageDown = '⇟',
  Home = '⇱',
  End = '⇲',
  ArrowLeft = '⇠',
  ArrowUp = '⇡',
  ArrowRight = '⇢',
  ArrowDown = '⇣'
}

function inVisibleArea(el: HTMLElement, container: HTMLElement) {
  const elRect = el.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  return elRect.top >= containerRect.top
    && elRect.bottom <= containerRect.bottom
}

export const List = forwardRefWithStatic<{
  readonly prefix: 'ppd-list'
}, ListRef, ListProps>((props, ref) => {
  const {
    selectable = false
  } = props
  const { prefix } = List
  const items: ListItem[] = [
    { icon: 'file',
      id: 'index.ts',
      label: 'index.ts',
      placeholder: '[entry] very longerrrrrrrrrrrrrrrrrrrrrr placeholder' },
    { icon: 'beaker',
      id: 'index.spec.ts',
      label: 'index.spec.ts',
      placeholder: '[entry] test' },
    { icon: 'file',
      id: 'tsconfig.json',
      label: 'tsconfig.json' },
    ...[...Array(100)].map((_, i) => ({
      icon: 'file',
      id: `item-${i}`,
      label: `Item ${i}`
    })),
    { icon: 'folder-library',
      id: 'node_modules',
      label: 'node_modules' }
  ]

  const listRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])
  const [visibleItems, setVisibleItems] = useState<[
    id: string,
    el: HTMLDivElement
  ][]>([])

  const computeVisibleItems = useCallback(() => {
    const visibleItems: [
      id: string,
      el: HTMLDivElement
    ][] = []
    itemsRef.current.forEach(el => {
      if (listRef.current && inVisibleArea(el, listRef.current)) {
        visibleItems.push([el.dataset.id!, el])
      }
    })
    return visibleItems
  }, [])
  useEffect(() => {
    setVisibleItems(computeVisibleItems())
  }, [computeVisibleItems])

  const scrollRetimer = useRetimer()
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollRetimer(setTimeout(() => {
      setVisibleItems(computeVisibleItems())
    }, 200) as unknown as number)
  }, [computeVisibleItems, scrollRetimer])

  const [keyword, setKeyword] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  function pushSelectedId(id?: string, isUnshift = false) {
    if (!id) return

    setSelectedIds(selectedIds => {
      const findIndex = selectedIds.indexOf(id)
      return findIndex !== -1 ? selectedIds : isUnshift
        ? [id, ...selectedIds]
        : [...selectedIds, id]
    })
  }
  function toggleSelectedId(id?: string, isUnshift = false) {
    if (!id) return

    setSelectedIds(selectedIds => {
      const findIndex = selectedIds.indexOf(id)
      return findIndex !== -1
        ? [...selectedIds.slice(0, findIndex), ...selectedIds.slice(findIndex + 1)]
        : isUnshift
          ? [id, ...selectedIds]
          : [...selectedIds, id]
    })
  }

  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  function focusTo(index: number) {
    if (index < 0 || index >= itemsRef.current.length) return
    itemsRef.current[index].focus()
  }
  function focusItem(index: number) {
    if (index >= itemsRef.current.length) return
    const realIndex = index !== -1 ? index : items.length - 1
    setFocusedIndex(realIndex)
    focusTo(realIndex)
  }

  // noinspection GrazieInspection,StructuralWrap
  return <div
    ref={listRef}
    tabIndex={0}
    className={prefix}
    onClick={() => setSelectedIds([])}
    onFocus={() => focusTo(focusedIndex)}
    onKeyDown={e => {
      const withCtrlOrMeta = e.ctrlKey || (
        isMacOS && e.metaKey
      )
      const withShift = e.shiftKey
      const withAlt = e.altKey

      const withoutAll = !withCtrlOrMeta && !withShift && !withAlt

      function pageUpOrDown(direction: 1 | -1, _visibleItems = visibleItems) {
        const [targetId, el] = _visibleItems[
          direction === -1 ? 0 : _visibleItems.length - 1
          ]
        const tmpIndex = items.findIndex(({ id }) => id === targetId)
        if (tmpIndex === focusedIndex) {
          if (listRef.current) {
            if (direction === -1) {
              listRef.current.scrollTo({
                top: el.offsetTop - listRef.current.offsetHeight + el.offsetHeight + 16,
                behavior: 'instant'
              })
            } else {
              listRef.current.scrollTo({
                top: el.offsetTop - 8,
                behavior: 'instant'
              })
            }
            return pageUpOrDown(direction, computeVisibleItems())
          }
        }
        return tmpIndex
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        const direction = e.key === 'ArrowUp' ? -1 : 1
        let index = -1
        // ⇡/⇣ : change focus
        if (!withAlt && !withCtrlOrMeta) {
          if (focusedIndex === -1) {
            index = direction === -1 ? items.length - 1 : 0
          } else {
            index = listRef.current === document.activeElement
              ? focusedIndex
              : (focusedIndex + direction) % items.length
          }
        }
        // ⌘ ⇡/⇣ : forward ⇱/⇲
        if (withCtrlOrMeta) {
          index = direction === -1 ? 0 : items.length - 1
        }
        // ⌥ ⇡/⇣ : forward ⇞/⇟
        if (withAlt) {
          index = pageUpOrDown(direction)
        }
        focusItem(index)
        if (withShift) {
          // ⇧ ⇡/⇣ : change focus and select
          if (!withAlt && !withCtrlOrMeta) {
            pushSelectedId(items[index]?.id)
            pushSelectedId(items[focusedIndex]?.id)
            return
          }
          // ⌘ ⇧ ⇡/⇣ : forward ⇱/⇲ and select
          // ⌥ ⇧ ⇡/⇣ : forward ⇞/⇟ and select
          return
        }
      }
      // ⇞/⇟     : focus visible first/last
      // ⇱/⇲     : focus first/last

      // ⇠/⇢      : [open]|[close]
      // ⇧ ⇠/⇢    : [open]|[close] and select

      // ⌘ a      : select all
      // ⌘ r      : reveal
      // ⌘ z      : undo
      // ⌘ v      : change view mode
      // ⌘ +      : fold selected
      // ⌘ -      : unfold selected
      // ⌘ ⇧ +    : fold all
      // ⌘ ⇧ -    : unfold all

      // ⌘ f      : lower find                      |
      // ⌘ ⇧ f    : higher find                     |
        // ^ ⌥ c  : toggle upper/lower ignore case  |
        // ^ ⌥ w  : toggle word match               |
        // ^ ⌥ f  : configure filers                |-- ⎋ : exit find mode
      // ⌘ g      : find by glob expression         |
      // /        : find by regex                   |
      // %        : find by fuzzy                   |
      // ⌘ /      : switch start with mode          |

      // ?        : get help

      // \\       : find start with \
      // \/       : find start with /
      // \%       : find start with %
      // \?       : find start with ?
      // any char : find

      // ⎋   : clear selection
      if (e.key === 'Escape' && withoutAll) {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIds([])
        return
      }
      // ␣ : toggle select
      if (e.key === ' ' && withoutAll) {
        e.preventDefault()
        e.stopPropagation()
        toggleSelectedId(items[focusedIndex]?.id)
        return
      }
      // ⏎   : [select]|[open]
      // ⌘ ⏎ : [open]|[open in new tab]
      // ⇥   : focus next
      console.log(e.key, e.keyCode, e.ctrlKey, e.metaKey, e.shiftKey)
      e.preventDefault()
      e.stopPropagation()
    }}
    onScroll={onScroll}
    >
    <div className={`${prefix}-wrap`}>
      {items.map((item, index) => <div
        ref={el => el && (itemsRef.current[index] = el)}
        key={item.id}
        tabIndex={item.disabled ? undefined : 0}
        data-id={item.id}
        className={classnames(
          `${prefix}-item`,
          selectable && !item.disabled && 'clickable',
          item.disabled && 'disabled',
          selectedIds.includes(item.id) && 'selected'
        )}
        onClick={e => {
          e.stopPropagation()
          if (!selectable || item.disabled) return

          const withCtrlOrMeta = e.ctrlKey || e.metaKey
          const withShift = e.shiftKey
          if (!withCtrlOrMeta && !withShift) {
            setSelectedIds([item.id])
            return
          }
          if (withCtrlOrMeta) {
            toggleSelectedId(item.id)
            return
          }

          setSelectedIds(_selectedIds => {
            if (_selectedIds.length === 0) return [item.id]
            const selectedIds = [..._selectedIds]

            const findIndex = items.findIndex(({ id }) => id === item.id)
            const prevSelectedId = selectedIds[selectedIds.length - 1]
            const prevSelectedIndex = items.findIndex(({ id }) => id === prevSelectedId)

            const range = findIndex < prevSelectedIndex
              ? [findIndex, prevSelectedIndex - 1]
              : [prevSelectedIndex + 1, findIndex]
            let i = range[0]
            for (let j = i - 1; selectedIds.includes(items[j]?.id) && j >= 0; j--) {
              if (j === prevSelectedIndex) continue

              const item = items[j]
              const index = selectedIds.indexOf(item.id)
              if (!item.disabled && index !== -1) {
                selectedIds.splice(index, 1)
              }
            }
            for (; i <= range[1]; i++) {
              const item = items[i]
              const index = selectedIds.indexOf(item.id)
              if (!item.disabled && index === -1) {
                selectedIds.unshift(item.id)
              }
            }
            for (; selectedIds.includes(items[i]?.id) && i < items.length; i++) {
              if (i === prevSelectedIndex) continue

              const item = items[i]
              const index = selectedIds.indexOf(item.id)
              if (!item.disabled && index !== -1) {
                selectedIds.splice(index, 1)
              }
            }
            return selectedIds
          })
        }}
        onFocus={e => {
          e.stopPropagation()
          setFocusedIndex(index)
        }}
      >
        {item.icon && typeof item.icon === 'string'
          ? <span className={`${prefix}-item__icon cldr codicon codicon-${item.icon}`} />
          : item.icon}
        {item.content
          ? typeof item.content === 'function'
            ? item.content(keyword, item)
            : item.content
          : <code className={`${prefix}-item__label`}>{item.label}</code>}
        {item.placeholder && typeof item.placeholder === 'string'
          ? <code className={`${prefix}-item__placeholder`}>{item.placeholder}</code>
          : item.placeholder}
      </div>)}
    </div>
  </div>
})
Object.defineProperty(List, 'prefix', {
  value: 'ppd-list',
  writable: false
})
