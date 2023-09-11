import './List.scss'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRetimer } from 'foxact/use-retimer'

import { usePopper } from '../../hooks/usePopper'
import { classnames, isMacOS } from '../../utils'

import type { DialogRef } from './Dialog'
import { Dialog } from './Dialog'
import { forwardRefWithStatic } from './forwardRefWithStatic'

export interface ListItem {
  /** @default 0 */
  indent?: number

  icon?: string | React.ReactNode
  id: string
  label: string
  content?: React.ReactNode | ((keyword: string, item: ListItem) => React.ReactNode)
  placeholder?: string | React.ReactNode

  disabled?: boolean
}
export interface ListProps {
  selectable?: boolean

  items?: ListItem[]
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

const EMPTY_LIST_ITEMS: ListItem[] = []

export const List = forwardRefWithStatic<{
  readonly prefix: 'ppd-list'
}, ListRef, ListProps>((props, ref) => {
  const {
    selectable = false
  } = props
  const { prefix } = List
  const {
    items = EMPTY_LIST_ITEMS
  } = props

  const helpDialogRef = useRef<DialogRef>(null)

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
  const onScroll = useCallback(() => {
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
  function toggleRangeSelectedId(id?: string) {
    if (!id) return

    setSelectedIds(_selectedIds => {
      if (_selectedIds.length === 0) return [id]
      const selectedIds = [..._selectedIds]

      const findIndex = items.findIndex(({ id: iid }) => iid === id)
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

  const [foldedIds, setFoldedIds] = useState<string[]>([])
  const [hidedIds, setHidedIds] = useState<string[]>([])
  const getChildren = useCallback((id: string) => {
    const children: ListItem[] = []
    const index = items.findIndex(({ id: iid }) => iid === id)
    const indent = items[index]?.indent ?? 0
    for (let i = index + 1; i < items.length; i++) {
      const item = items[i]
      const iindent = item.indent ?? 0
      if (iindent > indent) {
        children.push(item)
      }
      if (iindent <= indent) {
        break
      }
    }
    return children
  }, [items])
  function foldId(id: string, isFolded?: boolean) {
    setFoldedIds(foldedIds => {
      const index = foldedIds.indexOf(id)
      const children = getChildren(id)
      if (index === -1 && isFolded !== false) {
        setHidedIds(hidedIds => [...hidedIds, ...children.map(({ id }) => id)])
        return [...foldedIds, id]
      } else {
        setHidedIds(hidedIds => hidedIds.filter(id => !children.map(({ id }) => id).includes(id)))
        return [...foldedIds.slice(0, index), ...foldedIds.slice(index + 1)]
      }
    })
  }
  function toggleFoldAll(isFolded?: boolean) {
    // TODO performance
    if (isFolded) {
      const hidedIds = new Set<string>()
      const foldedIds = items.reduce((acc, item) => {
        const children = getChildren(item.id)
        if (children.length > 0) {
          children.map(({ id }) => hidedIds.add(id))
          acc.push(item.id)
        }
        return acc
      }, [] as string[])
      setFoldedIds(foldedIds)
      setHidedIds([...hidedIds])
    } else {
      setFoldedIds([])
      setHidedIds([])
    }
  }

  const [enableUpperKeywordsIgnore, setEnableUpperKeywordsIgnore] = useState(true)
  const [enableWordMatch, setEnableWordMatch] = useState(false)
  const [searchMode, setSearchMode] = useState<
    | 'strict'
    | 'regex'
    | 'fuzzy'
    | 'glob'
    | 'start-with'
  >('fuzzy')
  const enableSearch = useMemo(() => (
    keyword.length > 0
  ) || (
    searchMode !== 'fuzzy'
  ), [searchMode, keyword])
  const searchbarTooltip = useMemo(() =>
    `Search by "${
      searchMode
    }" mode.`
      + '\npress `/` switch to regex mode.'
      + '\npress `⌘ f` switch to strict mode.'
      + '\npress `⌘ g` switch to glob mode.'
      + '\npress `⌘ /` switch to start with mode.'
      + '\npress any char switch to trigger fuzzy mode.',
  [searchMode])

  const searchbarPopper = usePopper({
    className: `${prefix}-searchbar`,
    placement: 'top-start',
    focusAbility: false,
    offset: [8, 0],
    arrowVisible: false,
    referenceElement: listRef.current,
    content: <>
      {searchMode === 'glob'
        ? <code className='cldr codicon' title={searchbarTooltip}>G</code>
        : searchMode === 'start-with'
          ? <code className='cldr codicon' title={searchbarTooltip}>/</code>
          : <span
            className={classnames('cldr codicon', {
              strict: 'codicon-search',
              regex: 'codicon-regex',
              fuzzy: 'codicon-search-fuzzy'
            }[searchMode])}
            title={searchbarTooltip}
          />}
      <span
        className={classnames('cldr codicon codicon-text-size clickable', {
          [`${prefix}-searchbar--active`]: enableUpperKeywordsIgnore
        })}
        onClick={() => setEnableUpperKeywordsIgnore(e => !e)}
        title='Toggle Upper/Lower Ignore Case'
      />
      <span
        className={classnames('cldr codicon codicon-whole-word clickable', {
          [`${prefix}-searchbar--active`]: enableWordMatch
        })}
        onClick={() => setEnableWordMatch(e => !e)}
        title='Toggle Word Match'
      />
      <code>{keyword.replace(/ /g, '␣')}</code>
    </>
  })
  useEffect(() => {
    searchbarPopper.changeVisible(enableSearch)
  }, [enableSearch, searchbarPopper])
  const labelMatcher = useCallback((item: ListItem) => {
    if (!enableSearch) return null

    if (searchMode === 'glob') {
      // TODO refactor by https://github.com/micromatch/micromatch ?
      const regexpStr = keyword
        .replace(/\*/g, '[^/]*')
        .replace(/\*\*/g, '.*')
        .replace(/\?/g, '[^/]')
      try {
        const reg = new RegExp(regexpStr, enableUpperKeywordsIgnore ? 'i' : '')
        return reg.exec(item.label)
      } catch (e) {
        console.error(e)
        return null
      }
    }

    const noRegExpChars = ['\\', '.', '*', '+', '?', '^', '$', '(', ')', '[', ']', '{', '}', '|']
    const noRegExpKeyword = searchMode === 'regex'
      ? keyword
      : noRegExpChars.reduce((prev, curr) => prev.replace(curr, `\\${curr}`), keyword)

    const regexpStr = !enableWordMatch
      ? noRegExpKeyword
      : `\\b${noRegExpKeyword}\\b`
    try {
      const reg = new RegExp(
        searchMode === 'strict'
          ? `^${regexpStr}$`
          : searchMode === 'start-with'
            ? `^${regexpStr}`
            : noRegExpKeyword,
        enableUpperKeywordsIgnore ? 'i' : ''
      )
      return reg.exec(item.label)
    } catch (e) {
      console.error(e)
      return null
    }
  }, [enableSearch, enableUpperKeywordsIgnore, enableWordMatch, keyword, searchMode])
  function labelContentRender(item: ListItem) {
    const parts = labelMatcher(item)
    if (!parts) return item.label

    const index = parts.index
    const length = parts[0].length
    if (index === -1 || length === 0) return item.label

    return <>
      {item.label.slice(0, index)}
      <b className={`${prefix}-item__label__keyword`}>
        {item.label.slice(index, index + length)}
      </b>
      {item.label.slice(index + length)}
    </>
  }
  const filteredItemsWithIndex = useMemo(() => {
    if (!enableSearch) return []

    return items.reduce((acc, item, index) => {
      const parts = labelMatcher(item)
      if (parts) {
        acc.push([index, item])
      }
      return acc
    }, [] as [index: number, item: ListItem][])
  }, [enableSearch, items, labelMatcher])
  // noinspection GrazieInspection,StructuralWrap
  return <>
    {searchbarPopper.popper}
    <HelpDialog ref={helpDialogRef} />
    <div
      ref={listRef}
      tabIndex={0}
      className={prefix}
      onClick={() => setSelectedIds([])}
      onFocus={() => focusTo(focusedIndex)}
      onKeyDown={async e => {
        const withCtrlOrMeta = e.ctrlKey || (
          isMacOS && e.metaKey
        )
        const withShift = e.shiftKey
        const withAlt = e.altKey

        const withoutAll = !withCtrlOrMeta && !withShift && !withAlt
        const withoutAllNoShift = !withCtrlOrMeta && !withAlt

        async function pageUpOrDown(direction: 1 | -1, _visibleItems = visibleItems) {
          const [targetId, el] = _visibleItems[
            direction === -1 ? 0 : _visibleItems.length - 1
            ]
          const tmpIndex = items.findIndex(({ id }) => id === targetId)
          if (tmpIndex === focusedIndex) {
            if (listRef.current) {
              if (direction === -1) {
                listRef.current.scrollTo({
                  top: el.offsetTop - listRef.current.offsetHeight + el.offsetHeight + 16,
                  behavior: 'auto'
                })
              } else {
                listRef.current.scrollTo({
                  top: el.offsetTop - 8,
                  behavior: 'auto'
                })
              }
              // TODO performance
              return pageUpOrDown(direction, computeVisibleItems())
            }
          }
          return tmpIndex
        }

        // ⇱/⇲ : forward to ⌘ ⇡/⇣
        // ⇞/⇟ : forward to ⌥ ⇡/⇣
        if (
          ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)
        ) {
          e.preventDefault()
          e.stopPropagation()
          const direction = [
            'ArrowUp',
            'PageUp',
            'Home'
          ].includes(e.key) ? -1 : 1

          const isPagination = withAlt || e.key === 'PageUp' || e.key === 'PageDown'
          const isJump = withCtrlOrMeta || e.key === 'Home' || e.key === 'End'

          let index = -1
          // ⇡/⇣ : change focus
          if (!isPagination && !isJump) {
            if (focusedIndex === -1) {
              index = direction === -1 ? items.length - 1 : 0
            } else {
              index = listRef.current === document.activeElement
                ? focusedIndex
                : (focusedIndex + direction) % items.length
            }
            // skip item when it is hided
            while (hidedIds.length > 0 && hidedIds.includes(items[index]?.id)) {
              index = (index + direction) % items.length
            }
            if (enableSearch) {
              if (filteredItemsWithIndex.length === 0) return
              let [
                filteredItemsFindIndexForTarget,
                filteredItemsFindIndexForOrigin
              ] = [-1, -1]
              for (let i = 0; i < filteredItemsWithIndex.length; i++) {
                const [_i] = filteredItemsWithIndex[i]
                if (_i === index) {
                  filteredItemsFindIndexForTarget = i
                }
                if (_i === focusedIndex) {
                  filteredItemsFindIndexForOrigin = i
                }
                if (filteredItemsFindIndexForTarget !== -1 && filteredItemsFindIndexForOrigin !== -1) {
                  break
                }
              }
              if (filteredItemsFindIndexForTarget === -1) {
                if (filteredItemsFindIndexForOrigin !== -1) {
                  const nIndex = filteredItemsFindIndexForOrigin + direction
                  const [targetIndex] = filteredItemsWithIndex[
                    nIndex < 0
                      ? filteredItemsWithIndex.length - 1
                      : nIndex % filteredItemsWithIndex.length
                    ]
                  index = targetIndex
                }
              }
            }
          }
          // ⌘ ⇡/⇣ : focus first/last
          if (isJump) {
            index = direction === -1 ? 0 : items.length - 1
          }
          // ⌥ ⇡/⇣ : focus visible first/last
          if (isPagination) {
            index = await pageUpOrDown(direction)
          }
          focusItem(index)
          if (withShift) {
            // ⇧ ⇡/⇣ : change focus and select
            if (!isPagination && !isJump) {
              pushSelectedId(items[index]?.id)
              pushSelectedId(items[focusedIndex]?.id)
              return
            }
            // ⌘ ⇧ ⇡/⇣ : forward ⇱/⇲ and select
            // ⌥ ⇧ ⇡/⇣ : forward ⇞/⇟ and select
            toggleRangeSelectedId(items[index]?.id)
            return
          }
        }

        // ⇠/⇢   : [open]|[close]
        // ⌘ +   : fold selected
        // ⌘ -   : unfold selected
        // ⌘ ⇧ + : fold all
        // ⌘ ⇧ - : unfold all
        if ([
          'ArrowLeft',
          'ArrowRight',
          '-',
          '='
        ].includes(e.key)) {
          const direction = [
            'ArrowLeft',
            '-'
          ].includes(e.key) ? -1 : 1
          const isMinusOrEqual = ['-', '='].includes(e.key)
          if (isMinusOrEqual && !withCtrlOrMeta) return

          if (!withShift) {
            const item = items[focusedIndex]
            if (item) {
              foldId(item.id, direction === -1)
            }
          } else {
            if (isMinusOrEqual) {
              toggleFoldAll(direction === -1)
            } else {
              // TODO
              //   ⇧ ⇠/⇢ : [open]|[close] and select
            }
          }
          e.preventDefault()
          e.stopPropagation()
          return
        }

        // ⌘ a : select all
        if (e.key === 'a' && withCtrlOrMeta && !withShift && !withAlt) {
          e.preventDefault()
          e.stopPropagation()
          // TODO support filtered items select all
          setSelectedIds(items.map(({ id }) => id))
          return
        }
        // ⌘ r : reveal
        if (e.key === 'r' && withCtrlOrMeta && !withShift && !withAlt) {
          e.preventDefault()
          e.stopPropagation()
          const el = itemsRef.current[focusedIndex]
          listRef.current?.scrollTo({
            top: el.offsetTop - listRef.current.clientHeight * 0.382,
            behavior: 'smooth'
          })
          return
        }
        // ⌘ z      : undo
        // ⌘ v      : change view mode

        // ␣ : toggle select, (support quick preview?)
        if (e.key === ' ' && withoutAll && !enableSearch) {
          e.preventDefault()
          e.stopPropagation()
          toggleSelectedId(items[focusedIndex]?.id)
          return
        }

        // ? : get help
        if (e.key === '?' && withoutAllNoShift && keyword.length === 0) {
          e.preventDefault()
          e.stopPropagation()
          helpDialogRef.current?.open()
          return
        }

        // ⌘ f      : lower find                      |
        // ⌘ ⇧ f    : higher find                     |
        // ⌥ c    : toggle upper/lower ignore case  |
        // ⌥ w    : toggle word match               |
        // ⌥ f    : configure filers                |-- ⎋ : exit find mode
        // /        : find by regex                   |
        // ⌘ g      : find by glob expression         |
        // ⌘ /      : switch start with mode          |
        // ⌘ %(5)   : switch fuzzy mode               |
        // ⌫      : delete last char                |
        if (e.key === 'f' && withCtrlOrMeta && !withShift && !withAlt) {
          e.preventDefault()
          e.stopPropagation()
          setSearchMode('strict')
          setKeyword('')
          return
        }
        if (enableSearch) {
          // ⎋
          if (e.key === 'Escape' && withoutAll) {
            e.preventDefault()
            e.stopPropagation()
            setKeyword('')
            if (searchMode !== 'fuzzy') {
              setSearchMode('fuzzy')
            }
            return
          }
          // ⌫
          if (e.key === 'Backspace' && withoutAll) {
            e.preventDefault()
            e.stopPropagation()
            setKeyword(keyword => keyword.slice(0, -1))
            if (keyword.length <= 1) {
              setKeyword('')
              if (searchMode !== 'fuzzy') {
                setSearchMode('fuzzy')
              }
            }
            return
          }
          // ⌥ c
          if (e.key === 'ç') {
            e.preventDefault()
            e.stopPropagation()
            setEnableUpperKeywordsIgnore(e => !e)
            return
          }
          // ⌥ w
          if (e.key === '∑') {
            e.preventDefault()
            e.stopPropagation()
            setEnableWordMatch(e => !e)
            return
          }
        } else {
          if (e.key === '/' && withoutAll) {
            e.preventDefault()
            e.stopPropagation()
            setSearchMode('regex')
            return
          }
        }
        // ⌘ g
        if (e.key === 'g' && withCtrlOrMeta && !withShift && !withAlt) {
          e.preventDefault()
          e.stopPropagation()
          if (searchMode !== 'glob') {
            setSearchMode('glob')
          } else {
            setSearchMode('fuzzy')
          }
          return
        }
        // ⌘ /
        if (e.key === '/' && withCtrlOrMeta && !withShift && !withAlt) {
          e.preventDefault()
          e.stopPropagation()
          if (searchMode !== 'start-with') {
            setSearchMode('start-with')
          } else {
            setSearchMode('fuzzy')
          }
          return
        }
        // ⌘ %(5)
        if (e.key === '5' && withCtrlOrMeta && !withShift && !withAlt) {
          e.preventDefault()
          e.stopPropagation()
          if (searchMode !== 'fuzzy') {
            setSearchMode('fuzzy')
          }
          return
        }

        // any char : fuzzy find
        if (e.key.length === 1 && withoutAllNoShift) {
          e.preventDefault()
          e.stopPropagation()
          // \/ : find /
          // \? : find ?
          setKeyword(keyword => {
            if (keyword === '\\' && (
              e.key === '/' ||
              e.key === '?'
            )) {
              return e.key
            } else
              return keyword + e.key
          })
          return
        }

        // ⎋   : clear selection
        if (e.key === 'Escape' && withoutAll) {
          e.preventDefault()
          e.stopPropagation()
          setSelectedIds([])
          return
        }
        // ⏎   : [select]|[open]
        // ⌘ ⏎ : [open]|[open in new tab]
        // ⇥   : focus next
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
            selectedIds.includes(item.id) && 'selected',
            hidedIds.includes(item.id) && 'hided'
          )}
          style={{
            // @ts-ignore
            '--indent-level': item.indent ?? 0
          }}
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

            toggleRangeSelectedId(item.id)
          }}
          onFocus={e => {
            e.stopPropagation()
            setFocusedIndex(index)
          }}
        >
          {(items[index + 1]?.indent ?? 0) > (item?.indent ?? 0)
            ? <button
              className={`${prefix}-item__icon cldr codicon codicon-chevron-right`}
              style={{
                transform: foldedIds.includes(item.id)
                  ? 'rotate(0deg)'
                  : 'rotate(90deg)'
              }}
              onClick={e => {
                e.stopPropagation()
                foldId(item.id)
              }}
            />
            : <span className={`${prefix}-item__icon cldr space`} />}
          {item.icon && typeof item.icon === 'string'
            ? <span className={`${prefix}-item__icon cldr codicon codicon-${item.icon}`} />
            : item.icon}
          {item.content
            ? typeof item.content === 'function'
              ? item.content(keyword, item)
              : item.content
            : <code className={`${prefix}-item__label`}>{labelContentRender(item)}</code>}
          {item.placeholder && typeof item.placeholder === 'string'
            ? <code className={`${prefix}-item__placeholder`}>{item.placeholder}</code>
            : item.placeholder}
        </div>)}
      </div>
    </div>
  </>
})
Object.defineProperty(List, 'prefix', {
  value: 'ppd-list',
  writable: false
})

const CMD_OR_CTRL = isMacOS
  ? KeyMapUnicodeEmoji.Command : 'Ctrl'
const CTRL = isMacOS
  ? KeyMapUnicodeEmoji.Control : 'Ctrl'
const SPLITTER = Symbol('SPLITTER')

type KeymapSection = [
  description: string | {
    label: string
    description?: ReactNode
  },
  ...keys: (
    | string
    | symbol
    | string[]
  )[]
][]

const helpDialogGifs = Object.entries(import.meta.glob(
  '../../assets/list-help-dialog/*.gif',
  { as: 'url', eager: true }
)).reduce((acc, [key, value]) => {
  const name = key.match(/\/([^/]+)\.gif$/)![1]
  acc[name] = value
  return acc
}, {} as Record<string, string>)

const HelpDialog = forwardRefWithStatic<{
  readonly prefix: 'ppd-help-dialog'
}, DialogRef>((...[, ref]) => {
  const {
    prefix
  } = HelpDialog
  const sectionPrefix = `${prefix}__section`

  const [theme, setTheme] = useState<string>('light')
  useEffect(() => onThemeChange(setTheme), [])

  const cachedRef = useRef<[(HTMLDivElement | null)?, KeymapSection[number][0]?]>([])
  const keymap: Record<string, KeymapSection> = {
    Base: [
      [{
        label: 'Display help message dialog',
        description: 'It\'s essentially like entering a "?" isn\'t it?'
      }, KeyMapUnicodeEmoji.Shift, '/'],
      [{
        label: 'Search item with fuzzy mode',
        description: <>
          Press any char to trigger fuzzy mode,
          but if you want to find <code>/</code> or <code>?</code>,
          <span
            onMouseEnter={e => {
              e.stopPropagation()
              demo.visible
                ? toggleDemoPopper(true)
                : demo.changeVisible(true)
              cachedRef.current = [affixElement, hoverItem]
              setAffixElement(
                (e.target as HTMLElement)
                  .closest('span') as HTMLDivElement
              )
              setHoverItem({
                label: 'Search item with fuzzy mode.special'
              })
            }}
            onMouseLeave={e => {
              e.stopPropagation()
              const [el, item] = cachedRef.current
              if (el) {
                setAffixElement(el)
                setHoverItem(item)
              }
            }}
            >
            &nbsp;press <kbd>\</kbd> first, then press <kbd>/</kbd> or <kbd>?</kbd> .
          </span>
          <br />
          <code>\w</code> means you can enter any character to trigger the list search mode.
        </>
      }, '\\w']
    ],
    Focus: [
      ['Up or down 1 item',
        KeyMapUnicodeEmoji.ArrowUp, SPLITTER,
        KeyMapUnicodeEmoji.ArrowDown
      ],
      ['Up or down 1 page',
        KeyMapUnicodeEmoji.PageUp, SPLITTER,
        KeyMapUnicodeEmoji.PageDown, SPLITTER,
        KeyMapUnicodeEmoji.Option, `${KeyMapUnicodeEmoji.ArrowUp}/${KeyMapUnicodeEmoji.ArrowDown}`
      ],
      ['Up or down to first and last',
        KeyMapUnicodeEmoji.Home, SPLITTER,
        KeyMapUnicodeEmoji.End, SPLITTER,
        CMD_OR_CTRL, `${KeyMapUnicodeEmoji.ArrowUp}/${KeyMapUnicodeEmoji.ArrowDown}`
      ]
    ],
    Select: [
      ['Select all', CMD_OR_CTRL, 'A'],
      ['Select item', KeyMapUnicodeEmoji.Space],
      ['Select range',
        KeyMapUnicodeEmoji.Shift, [
          `${KeyMapUnicodeEmoji.ArrowUp}/${KeyMapUnicodeEmoji.ArrowDown}`,
          `${KeyMapUnicodeEmoji.PageUp}/${KeyMapUnicodeEmoji.PageDown}`,
          `${KeyMapUnicodeEmoji.Home}/${KeyMapUnicodeEmoji.End}`
        ]
      ]
    ],
    Search: [
      ['Search item with strict mode', CMD_OR_CTRL, 'F'],
      ['Search item with regex mode', '/'],
      ['Search item with glob mode', CMD_OR_CTRL, 'G'],
      ['Search item with start with mode', CMD_OR_CTRL, '/'],
      ['Toggle upper/lower ignore case', KeyMapUnicodeEmoji.Option, 'C'],
      ['Toggle word match', KeyMapUnicodeEmoji.Option, 'W'],
      ['Clear search', KeyMapUnicodeEmoji.Escape]
    ]
  }

  const [hoverItem, setHoverItem] = useState<KeymapSection[number][0]>()
  const [affixElement, setAffixElement] = useState<HTMLDivElement | null>(null)
  const demo = usePopper({
    className: classnames(
      `${prefix}__demo`,
      typeof hoverItem === 'object' && `${prefix}__demo--is-object`
    ),
    placement: 'top-start',
    focusAbility: false,
    offset: [0, 0],
    referenceElement: affixElement,
    content: typeof hoverItem === 'object' ? <>
      {(() => {
        const gif = helpDialogGifs[`${hoverItem.label}${theme === 'dark' ? '.dark' : ''}`]
          ?? helpDialogGifs[hoverItem.label]
        if (gif) {
          return <img src={gif} alt={hoverItem.label} />
        }
      })()}
      <div className={`${prefix}__demo__label`}>
        {hoverItem.label}
      </div>
      {hoverItem.description && <div className={`${prefix}__demo__description`}>
        {hoverItem.description}
      </div>}
    </> : hoverItem
  })
  const toggleDemoPopperRetimer = useRetimer()
  const toggleDemoPopper = useCallback((visible: boolean) => {
    toggleDemoPopperRetimer(setTimeout(() => {
      demo.changeVisible(visible)
    }, 1000) as unknown as number)
  }, [toggleDemoPopperRetimer, demo])
  return <Dialog
    ref={ref}
    className={prefix}
    style={{
      '--width': '90vw',
      '--max-height': '40vh'
    }}
    >
    {demo.popper}
    {Object.entries(keymap).map(([title, keymap]) => <div
      key={title}
      className={sectionPrefix}
    >
      <h3 className={`${sectionPrefix}__title`}>{title}</h3>
      <div className={`${sectionPrefix}__content`}>
        {keymap.map(([description, ...keys], index) => <div
          key={index}
          className={`${sectionPrefix}__content-item`}
          onMouseEnter={e => {
            demo.visible
              ? toggleDemoPopper(true)
              : demo.changeVisible(true)
            setAffixElement(
              (e.target as HTMLElement)
                .closest(`.${sectionPrefix}__content-item`) as HTMLDivElement
            )
            setHoverItem(description)
          }}
          onMouseLeave={() => toggleDemoPopper(false)}
        >
          <div className={`${sectionPrefix}__content-item__label-wrap`}>
            <span className={
              classnames(`${sectionPrefix}__content-item__label`, {
                'no-key': keys.length === 0
              })
            }>{
              typeof description === 'string'
                ? description
                : description.label
            }</span>
            <span className={
              `${sectionPrefix}__content-item__keys`
            }>
              {keys.map((key, index) => typeof key === 'symbol'
                ? <span key={index}
                        className={`${sectionPrefix}__content-item__keys-splitter`}>|</span>
                : Array.isArray(key)
                  ? <div key={index}
                         className={`${sectionPrefix}__content-item__keys-group`}>
                    {key.map((key, index) => <kbd key={index}>{key}</kbd>)}
                  </div>
                  : <kbd key={index}>{key}</kbd>)}
            </span>
          </div>
          {typeof description !== 'string'
            && !!description.description
            && <div className={`${sectionPrefix}__content-item__description`}>
              {description.description}
            </div>}
        </div>)}
      </div>
    </div>)}
  </Dialog>
})
Object.defineProperty(HelpDialog, 'prefix', {
  value: 'ppd-help-dialog',
  writable: false
})
