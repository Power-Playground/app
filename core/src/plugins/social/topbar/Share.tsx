import React from 'react'
import type { BarItemProps } from '@power-playground/core'
import { messenger } from '@power-playground/core'

import { Popover } from '../../../components/base/Popover'
import { NotImplemented } from '../../../components/NotImplemented'
import { isMacOS } from '../../../utils'

const prefix = 'social__share'

export const Share: React.ComponentType<BarItemProps> = () => {
  return <Popover
    style={{ order: -99 }}
    placement='top'
    content={<>
      Share to Social
      &nbsp;&nbsp;
      <kbd>{isMacOS ? '⌘' : 'Ctrl'} + SHIFT + S</kbd>
      <br />
      <span style={{ color: 'gray' }}>(Change mode by context menu.)</span>
    </>}
    offset={[0, 6]}
    >
    <button
      className={prefix}
      onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}
    >
      <span className='cldr codicon codicon-link' style={{ transform: 'rotate(-45deg)' }} />
    </button>
  </Popover>
}
