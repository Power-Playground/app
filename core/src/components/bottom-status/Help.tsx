import { useRef } from 'react'

import { isMacOS } from '../../utils'
import type { DialogRef } from '../Dialog.tsx'
import { Popover } from '../Popover.tsx'

import { HelpDialog } from './HelpDialog.tsx'

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
