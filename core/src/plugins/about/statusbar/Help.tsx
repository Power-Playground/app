import { useRef } from 'react'

import type { DialogRef } from '../../../components/base/Dialog'
import { Popover } from '../../../components/base/Popover'
import { isMacOS } from '../../../utils/isMacOS'

import { HelpDialog } from './HelpDialog'

export function Help() {
  const helpDialogRef = useRef<DialogRef>(null)

  return (
    <>
      <HelpDialog ref={helpDialogRef} />
      <Popover
        style={{ cursor: 'pointer' }}
        offset={[0, 3]}
        content={<>
          Find Help(<code>{isMacOS ? '^' : 'Ctrl'}</code> + <code>/</code>)
        </>}
        onClick={() => helpDialogRef.current?.open()}
        >
        <div className='cldr codicon codicon-info' />
      </Popover>
    </>
  )
}
