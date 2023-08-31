import React, { useRef } from 'react'
import type { BarItemProps } from '@power-playground/core'
import { isMacOS } from '@power-playground/core'

import type { DialogRef } from '../../../components/base/Dialog'
import { Popover } from '../../../components/base/Popover'

import { HistoryDialog } from './HistoryDialog'

export const History: React.ComponentType<BarItemProps> = ({ shareState }) => {
  const {
    code, setCode
  } = shareState
  const historyDialogRef = useRef<DialogRef>(null)

  return <>
    <HistoryDialog
      ref={historyDialogRef}
      code={code}
      // TODO set cursor position and dispatch change for every history item watcher
      onChange={ch => setCode?.(ch.code)}
    />
    <Popover
      style={{ cursor: 'pointer' }}
      offset={[0, 2]}
      content={<>
        Show History
        &nbsp;&nbsp;
        <kbd>{isMacOS ? '⌘' : 'Ctrl'} + H</kbd>
      </>}
      onClick={() => historyDialogRef.current?.open()}
      >
      <div className='cldr codicon codicon-history' />
    </Popover>
  </>
}
