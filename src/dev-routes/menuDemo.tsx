/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@vscode/codicons/dist/codicon.css'
import './menuDemo.scss'

import { useRef } from 'react'

import { List } from '../../core/src/components/base/List'
import { StopMenuTriggerError, useMenu } from '../../core/src/hooks/useMenu'
/* eslint-enable @typescript-eslint/no-restricted-imports */

export default function MenuDemo () {
  const btnRef = useRef<HTMLButtonElement>(null)
  const { popper, visible, changeVisible } = useMenu(
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
        icon: 'bell'
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
  return <>
    {popper}
    <button
      ref={btnRef}
      onClick={() => changeVisible(!visible)}>
      Menu Demo
    </button>
  </>
}
