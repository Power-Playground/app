import React, { useRef } from 'react'
import type { BarItemProps } from '@power-playground/core'
import { isMacOS } from '@power-playground/core'

import type { DialogRef } from '../../../components/base/Dialog'
import { Popover } from '../../../components/base/Popover'

import { HistoryDialog } from './HistoryDialog'

export const History: React.ComponentType<BarItemProps> = ({ shareState }) => {
  const {
    setCode
  } = shareState
  const historyDialogRef = useRef<DialogRef>(null)

  return <>
    <HistoryDialog
      ref={historyDialogRef}
      onChange={ch => setCode?.(ch.code)}
    />
    <Popover
      style={{ cursor: 'pointer' }}
      offset={[0, 3]}
      content={<>
        Show History(<code>
          {isMacOS ? '⌘' : 'Ctrl'}
        </code> + <code>H</code>)
      </>}
      onClick={() => historyDialogRef.current?.open()}
      >
      <div className='cldr codicon codicon-history' />
    </Popover>
  </>
}
