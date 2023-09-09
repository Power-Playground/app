import './List.scss'

import { useRef, useState } from 'react'

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

export const List = forwardRefWithStatic<{
  readonly prefix: 'ppd-list'
}, ListRef, ListProps>((props, ref) => {
  const {
    selectable = false
  } = props
  const { prefix } = List

  const listRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])
  const [keyword, setKeyword] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  function pushId(id?: string) {
    if (!id) return

    setSelectedIds(selectedIds => {
      const findIndex = selectedIds.indexOf(id)
      return findIndex !== -1 ? selectedIds : [...selectedIds, id]
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
          index = direction === -1 ? 0 : items.length - 1
        }
        focusItem(index)
        if (withShift) {
          // ⇧ ⇡/⇣ : change focus and select
          if (!withAlt && !withCtrlOrMeta) {
            pushId(items[index]?.id)
            pushId(items[focusedIndex]?.id)
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
    >
    <div className={`${prefix}-wrap`}>
      {items.map((item, index) => <div
        ref={el => el && (itemsRef.current[index] = el)}
        key={item.id}
        tabIndex={item.disabled ? undefined : 0}
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

          setSelectedIds(selectedIds => {
            if (!withCtrlOrMeta && !withShift) {
              return [item.id]
            }

            const findIndex = selectedIds.indexOf(item.id)
            if (withCtrlOrMeta) {
              if (findIndex === -1) {
                return [...selectedIds, item.id]
              } else {
                setTimeout(() => itemsRef.current[index].blur(), 10)
                return [...selectedIds.slice(0, findIndex), ...selectedIds.slice(findIndex + 1)]
              }
            }

            if (findIndex !== -1) {
              setTimeout(() => itemsRef.current[index].blur(), 10)
              return selectedIds
                .filter(id => id !== item.id)
            }

            let prevSelectedIndex = index
            let nextSelectedIndex = index
            let prevIndexIsSelected = false
            let nextIndexIsSelected = false
            do {
              // TODO select prev/next by prev step select item index
              if (!prevIndexIsSelected && prevSelectedIndex - 1 >= 0) {
                const temp = selectedIds.includes(items[prevSelectedIndex - 1].id)
                if (!temp) {
                  prevSelectedIndex--
                } else {
                  prevIndexIsSelected = temp
                  break
                }
              }
              if (!nextIndexIsSelected && nextSelectedIndex + 1 < items.length) {
                const temp = selectedIds.includes(items[nextSelectedIndex + 1].id)
                if (!temp) {
                  nextSelectedIndex++
                } else {
                  nextIndexIsSelected = temp
                  break
                }
              }
            } while (
              (
                prevSelectedIndex - 1 >= 0
              ) || (
                nextSelectedIndex + 1 < items.length
              )
              )
            const range = [index, index]
            if (prevIndexIsSelected && prevSelectedIndex >= 0) {
              range[0] = prevSelectedIndex
            }
            if (nextIndexIsSelected && nextSelectedIndex < items.length) {
              range[1] = nextSelectedIndex
            }
            const rangeIds = []
            for (let i = range[0]; i <= range[1]; i++) {
              rangeIds.push(items[i].id)
            }
            return selectedIds.concat(rangeIds.filter(id => !selectedIds.includes(id)))
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
