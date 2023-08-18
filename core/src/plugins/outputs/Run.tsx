import { Popover } from '../../components/base/Popover'
import { elBridgeP } from '../../eval-logs/bridge'
import { isMacOS } from '../../utils'
import { defineBarItem } from '..'

export const Run = defineBarItem(() => {
  return <Popover
    placement='top'
    content={<>
      Execute(<code>{isMacOS ? '⌘' : 'Ctrl'}</code> + <code>E</code>)
    </>}
    offset={[0, 6]}
    >
    <button className='excute'
            onClick={() => elBridgeP.send('run')}>
      <div className='cldr codicon codicon-play' />
    </button>
  </Popover>
})
