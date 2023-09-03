import React, { useContext } from 'react'

import { Popover } from '../../../components/base/Popover'
import { MonacoScopeContext } from '../../../contextes/MonacoScope'
import { isMacOS } from '../../../utils'
import type { BarItemProps } from '../..'

export const Save: React.ComponentType<BarItemProps> = () => {
  const { editorInstance } = useContext(MonacoScopeContext) ?? {}

  return <Popover
    style={{ order: -100 }}
    placement='top'
    content={<>
      Save
      &nbsp;&nbsp;
      <kbd>{isMacOS ? '⌘' : 'Ctrl'} + S</kbd>
    </>}
    offset={[0, 6]}
    >
    <button className='excute'
            onClick={() => editorInstance?.trigger('whatever', 'ppd.save', {})}>
      <div className='cldr codicon codicon-save' />
    </button>
  </Popover>
}
