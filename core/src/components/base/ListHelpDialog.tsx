import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRetimer } from 'foxact/use-retimer'

import { usePopper } from '../../hooks/usePopper'
import { classnames, isMacOS } from '../../utils'

import type { DialogRef } from './Dialog'
import { Dialog } from './Dialog'
import { forwardRefWithStatic } from './forwardRefWithStatic'

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

export const HelpDialog = forwardRefWithStatic<{
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
          but if you want to find <code>/</code> or <code>?</code>,&nbsp;
          <span
            style={{ textDecoration: 'underline', color: 'var(--primary)' }}
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
            press <kbd>\</kbd> first, then press <kbd>/</kbd> or <kbd>?</kbd> .
          </span>
          <br />
          <code>\w</code> means you can enter any character to trigger the list search mode.
        </>
      }, '\\w']
    ],
    Control: [
      [
        {
          label: 'Move focus index up or down 1 item',
          description: 'When you\'re in search mode, ' +
            'if the target location doesn\'t exist in the filtered results, ' +
            'it will jump to the next matching result\'s position.'
        },
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
      ],
      ['Toggle item select state', KeyMapUnicodeEmoji.Space],
      ['Select range',
        KeyMapUnicodeEmoji.Shift, [
        `${KeyMapUnicodeEmoji.ArrowUp}/${KeyMapUnicodeEmoji.ArrowDown}`,
        `${KeyMapUnicodeEmoji.PageUp}/${KeyMapUnicodeEmoji.PageDown}`,
        `${KeyMapUnicodeEmoji.Home}/${KeyMapUnicodeEmoji.End}`
        ]
      ],
      ['Select all', CMD_OR_CTRL, 'A'],
      ['Clear selection', KeyMapUnicodeEmoji.Escape],
      ['Toggle selected item fold state', CMD_OR_CTRL, '-/='],
      ['Toggle all items fold state', CMD_OR_CTRL, KeyMapUnicodeEmoji.Shift, '-/=']
    ],
    Search: [
      ['Search item with strict mode', CMD_OR_CTRL, 'F'],
      ['Search item with regex mode', '/'],
      ['Search item with glob mode', CMD_OR_CTRL, 'G'],
      ['Search item with start with mode', CMD_OR_CTRL, '/'],
      ['> Toggle upper/lower ignore case', KeyMapUnicodeEmoji.Option, 'C'],
      ['> Toggle word match', KeyMapUnicodeEmoji.Option, 'W'],
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
