/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@vscode/codicons/dist/codicon.css'
import './menuDemo.scss'

import { useRef, useState } from 'react'
import type { VirtualElement } from '@popperjs/core'

import { List } from '../../core/src/components/base/List'
import { StopMenuTriggerError, useMenu } from '../../core/src/hooks/useMenu'
import { createPointVEle } from '../../core/src/hooks/usePopper'
/* eslint-enable @typescript-eslint/no-restricted-imports */

export default function MenuDemo () {
  const btnRef = useRef<HTMLButtonElement>(null)
  const menu = useMenu(
    btnRef.current,
    [
      {
        id: '1',
        label: 'item 1',
        icon: List.SpaceSymbol
      },
      {
        id: '2',
        label: 'item 2',
        placeholder: <code className={`${List.prefix}-item__placeholder`}>
          ⌘ T
        </code>,
        icon: 'twitter'
      },
      {
        id: '3',
        label: 'item 3',
        icon: 'bell',
        children: [
          { id: '3-1', label: 'item 3-1', icon: 'bell-dot' },
          { id: '3-2', label: 'item 3-2', icon: 'bell-slash' }
        ]
      }
    ],
    {
      onTrigger: async (item) => {
        if (item.id === '1') {
          console.log('item 1')
        }
        if (item.id === '2') {
          throw new StopMenuTriggerError()
        }
        if (item.id === '3') {
          throw new Error('item 3')
        }
      }
    }
  )

  const [pos, setPos] = useState<VirtualElement | null>(null)
  const contextMenu = useMenu(
    pos,
    [
      {
        id: '1',
        label: 'item 1',
        icon: List.SpaceSymbol
      },
      {
        id: '2',
        label: 'item 2',
        placeholder: <code className={`${List.prefix}-item__placeholder`}>
          ⌘ T
        </code>,
        icon: 'twitter'
      },
      {
        id: '3',
        label: 'item 3',
        icon: 'bell',
        children: [
          { id: '3-1', label: 'item 3-1', icon: 'bell-dot' },
          { id: '3-2', label: 'item 3-2', icon: 'bell-slash' }
        ]
      }
    ],
    {
      noArrow: true,
      offset: [0, 0],
      onTrigger: async (item) => {
        if (item.id === '1') {
          console.log('item 1')
        }
        if (item.id === '2') {
          throw new StopMenuTriggerError()
        }
        if (item.id === '3') {
          throw new Error('item 3')
        }
      }
    }
  )
  return <>
    {menu.popper}
    {contextMenu.popper}
    <button
      ref={btnRef}
      onClick={() => menu.changeVisible(!menu.visible)}>
      Menu
    </button>
    <button
      onContextMenu={e => {
        e.preventDefault()
        setPos(createPointVEle(e.clientX, e.clientY))
        contextMenu.changeVisible(!contextMenu.visible)
      }}>
      ContextMenu
    </button>
  </>
}
