import './List.scss'

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useRetimer } from 'foxact/use-retimer'

import { usePopper } from '../../hooks/usePopper'
import { classnames, isMacOS } from '../../utils'

import type { DialogRef } from './Dialog'
import { forwardRefWithStatic } from './forwardRefWithStatic'
import type { HelpTipRef, IHelpTip } from './HelpTip'
import { HelpTip } from './HelpTip'
import { HelpDialog } from './ListHelpDialog'

type ListT = typeof List

export interface ListItem {
  /** @default 0 */
  indent?: number

  icon?: string | React.ReactNode | ListT['SpaceSymbol']
  id: string
  label: string
  content?: React.ReactNode | ((keyword: string, item: ListItem) => React.ReactNode)
  placeholder?: string | React.ReactNode

  disabled?: boolean

  className?: string
  style?: React.CSSProperties

  onClick?: (event: React.MouseEvent, item: ListItem) => boolean | void | Promise<boolean | void>
}
export interface ListProps<T extends ListItem = ListItem> {
  selectable?: boolean
  hideTip?: boolean

  items?: T[]
  defaultFocusIndex?: number
  defaultSelectedIds?: string[]
  /** @default Infinity */
  max?: number

  onClickItem?: (
    ref: HTMLDivElement | null,
    item: T,
    type: 'click' | 'dblclick' | 'contextmenu',
    event: React.MouseEvent
  ) => false | void | Promise<false | void>
  onKeyDown?: (event: React.KeyboardEvent) => false | void | Promise<false | void>
  onItemKeyDown?: (
    ref: HTMLDivElement | null,
    item: T,
    event: React.KeyboardEvent
  ) => false | void | Promise<false | void>
}
export interface ListRef {
  focus(index?: number): void
  help(): void
  fold(id?: string, isFolded?: boolean): void
}

function inVisibleArea(el: HTMLElement, container: HTMLElement) {
  const elRect = el.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  return elRect.top >= containerRect.top
    && elRect.bottom <= containerRect.bottom
}

const LIST_HELP_TIPS: IHelpTip[] = [
  /* eslint-disable react/jsx-key */
  [
    <>Did you know? After focusing on the list, pressing <kbd>?</kbd> ( <kbd>⇧</kbd> <kbd>/</kbd> ) can display help information.</>,
    50
  ],
  [
    <>Having trouble finding the file you want among too many files? Try focusing on this area and typing characters to search for it.</>,
    10
  ],
  [
    <>Glob is a powerful way to search for files. Try it! We support <code>*</code>, <code>**</code>, <code>?</code> and <code>␣</code> .</>,
    10
  ],
  [
    <>
      You can use <kbd>⌘</kbd> <kbd>f</kbd> to switch to strict mode,
      <kbd>⌘</kbd> <kbd>g</kbd> to switch to glob mode,
      and <kbd>⌘</kbd> <kbd>/</kbd> to switch to start with mode.
    </>,
    10
  ]
  /* eslint-enable react/jsx-key */
]

const EMPTY_LIST_ITEMS: ListItem[] = []

const _List = forwardRefWithStatic<{
  readonly prefix: 'ppd-list'
  readonly SpaceSymbol: symbol
}, ListRef, ListProps>((props: ListProps, ref) => {
  const {
    selectable = false,
    hideTip = false,
    defaultFocusIndex = -1,
    defaultSelectedIds = [],
    // TODO support max
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    max = Infinity,
    onClickItem,
    onItemKeyDown
  } = props
  const { prefix } = List
  const {
    items = EMPTY_LIST_ITEMS
  } = props
  const containIndent = useMemo(() => items.some(({ indent }) => indent !== undefined), [items])
  const containIcon = useMemo(() => items.some(({ icon }) => icon !== undefined), [items])

  const helpDialogRef = useRef<DialogRef>(null)
  const helpTipRef = useRef<HelpTipRef>(null)

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
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds)
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

  const [focusedIndex, setFocusedIndex] = useState<number>(defaultFocusIndex)
  const focusTo = useCallback((index: number) => {
    if (index < 0 || index >= itemsRef.current.length) return
    itemsRef.current[index].focus()
  }, [])
  const focusItem = useCallback((index: number) => {
    if (index >= itemsRef.current.length) return
    const realIndex = index !== -1 ? index : items.length - 1
    setFocusedIndex(realIndex)
    focusTo(realIndex)
  }, [focusTo, items.length])

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
  const foldId = useCallback((id: string, isFolded?: boolean) => {
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
  }, [getChildren])
  const toggleFoldAll = useCallback((isFolded?: boolean) => {
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
  }, [getChildren, items])

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

  useImperativeHandle(ref, () => ({
    focus(index?: number) {
      if (index === undefined) {
        listRef.current?.focus()
      } else {
        focusItem(index)
      }
    },
    help() {
      helpDialogRef.current?.open()
    },
    fold(id, isFolded) {
      const isAll = id === undefined
      if (isAll) {
        toggleFoldAll(isFolded)
      } else {
        foldId(id, isFolded)
      }
    }
  }), [focusItem, foldId, toggleFoldAll])
  // noinspection GrazieInspection,StructuralWrap
  return <>
    {searchbarPopper.popper}
    <HelpDialog ref={helpDialogRef} />
    <div
      ref={listRef}
      tabIndex={0}
      className={classnames(
        prefix,
        containIndent && `${prefix}--contain-indent`,
        containIcon && `${prefix}--contain-icon`
      )}
      onClick={() => setSelectedIds([])}
      onFocus={() => focusTo(focusedIndex)}
      onKeyDownCapture={async e => {
        const stopDefaultBehaviorForOnKeyDown = await props.onKeyDown?.(e)
        if (stopDefaultBehaviorForOnKeyDown === false) return

        const stopDefaultBehaviorForOnItemKeyDown = items[focusedIndex]
          && await onItemKeyDown?.(itemsRef.current[focusedIndex], items[focusedIndex], e)

        if (stopDefaultBehaviorForOnItemKeyDown === false) return

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
            if (selectable) {
              // ⇧ ⇡/⇣ : change focus and select
              if (!isPagination && !isJump) {
                !items[index]?.disabled
                  && pushSelectedId(items[index]?.id)
                !items[focusedIndex]?.disabled
                  && pushSelectedId(items[focusedIndex]?.id)
                return
              }
              // ⌘ ⇧ ⇡/⇣ : forward ⇱/⇲ and select
              // ⌥ ⇧ ⇡/⇣ : forward ⇞/⇟ and select
              toggleRangeSelectedId(items[index]?.id)
            }
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

          // TODO support change focus
          //  to lower indent item and unfold when press arrow right
          //  to upper indent item and fold when press arrow left
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
        // ⌘ t : open tooltip when enter fullscreen
        if (e.key === 't' && withCtrlOrMeta && !withShift && !withAlt) {
          e.preventDefault()
          e.stopPropagation()
          helpTipRef.current?.display()
          return
        }
        // ⌘ z      : undo
        // ⌘ v      : change view mode

        // ␣ : toggle select, (support quick preview?)
        if (e.key === ' ' && withoutAll && !enableSearch) {
          e.preventDefault()
          e.stopPropagation()
          if (selectable && !items[focusedIndex]?.disabled)
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

        // ⎋ : clear selection
        if (e.key === 'Escape' && withoutAll) {
          let isMatch = false
          resolve: {
            if (selectedIds.length > 0) {
              setSelectedIds([])
              isMatch = true
              break resolve
            }
            if (focusedIndex !== -1) {
              itemsRef.current[focusedIndex].blur()
              setFocusedIndex(-1)
              isMatch = true
              // when focus to list, it will focus to previous focused item
              // because of the focus event listener which closure the previous focused index
              setTimeout(() => listRef.current?.focus(), 100)
            }
          }
          if (isMatch) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
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
            hidedIds.includes(item.id) && 'hided',
            item.className
          )}
          style={{
            // @ts-ignore
            '--indent-level': item.indent ?? 0,
            ...item.style
          }}
          onContextMenu={async e => {
            e.stopPropagation()
            await onClickItem?.(itemsRef.current[index], item, 'contextmenu', e)
          }}
          onDoubleClick={async e => {
            e.stopPropagation()
            await onClickItem?.(itemsRef.current[index], item, 'dblclick', e)
          }}
          onClick={async e => {
            e.stopPropagation()

            const onClickItemContinue = await onClickItem?.(itemsRef.current[index], item, 'click', e)
            if (onClickItemContinue === false) return

            const onClickContinue = await item.onClick?.(e, item)
            if (onClickContinue === false) return

            if (!selectable) return

            const withCtrlOrMeta = e.ctrlKey || e.metaKey
            const withShift = e.shiftKey
            if (!item.disabled) {
              if (!withCtrlOrMeta && !withShift) {
                setSelectedIds([item.id])
                return
              }
              if (withCtrlOrMeta) {
                toggleSelectedId(item.id)
                return
              }
            }

            if (!withCtrlOrMeta && withShift)
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
            : typeof item.icon === 'symbol'
              ? {
                [List.SpaceSymbol]: <span className={`${prefix}-item__icon cldr space`} />
              }[item.icon]
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
      {!hideTip && <HelpTip
        ref={helpTipRef}
        tips={LIST_HELP_TIPS}
        storageKey='list'
      />}
    </div>
  </>
})
Object.defineProperty(_List, 'prefix', {
  value: 'ppd-list',
  writable: false
})
Object.defineProperty(_List, 'SpaceSymbol', {
  value: Symbol('ppd-list-space'),
  writable: false
})
export const List = _List as {
  readonly prefix: 'ppd-list'
  readonly SpaceSymbol: symbol
  <T extends ListItem>(props: ListProps<T> & { ref?: React.Ref<ListRef> }): JSX.Element
}
