import React from 'react'

import { Popover } from '../../components/base/Popover'
import { elBridgeP } from '../../eval-logs/bridge'
import { isMacOS } from '../../utils'
import type { BarItemProps } from '..'

export const Run: React.ComponentType<BarItemProps> = () => {
  return <Popover
    placement='top'
    content={<>
      Execute
      &nbsp;&nbsp;
      <kbd>{isMacOS ? '⌘' : 'Ctrl'} + E</kbd>
    </>}
    offset={[0, 6]}
    >
    <button className='execute'
            // @ts-ignore
            style={{ '--btn-color': '#4eb03e' }}
            onClick={() => elBridgeP.send('run')}>
      <div className='cldr codicon codicon-play' />
    </button>
  </Popover>
}
