import { useRef } from 'react'

import { isMacOS } from '../../utils'
import type { DialogRef } from '../Dialog.tsx'
import { Popover } from '../Popover.tsx'

import { HistoryDialog } from './HistoryDialog.tsx'

export interface HistoryProps {
  theme: string
  setCode: (code: string) => void
}

export function History({
  theme,
  setCode
}: HistoryProps) {
  const historyDialogRef = useRef<DialogRef>(null)
  return <>
    <HistoryDialog
      theme={theme}
      ref={historyDialogRef}
      onChange={ch => setCode(ch.code)}
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
