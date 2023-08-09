import './TopBar.scss'

import { elBridgeP } from '@power-playground/core'

import { isMacOS } from '../utils'

import { Popover } from './Popover.tsx'
import { Switcher } from './Switcher.tsx'

const prefix = 'ppd-top-bar'

export function TopBar({
  language, onChangeLanguage
}: {
  language: string
  onChangeLanguage: (language: 'js' | 'ts') => void
}) {
  const tsIcon = <div style={{ position: 'relative', width: 16, height: 16, backgroundColor: '#4272ba' }}>
    <span style={{
      position: 'absolute',
      right: -1,
      bottom: -3,
      transform: 'scale(0.4)',
      fontWeight: 'blob'
    }}>TS</span>
  </div>
  const jsIcon = <div style={{ position: 'relative', width: 16, height: 16, backgroundColor: '#f2d949' }}>
    <span style={{
      position: 'absolute',
      right: -1,
      bottom: -3,
      transform: 'scale(0.4)',
      fontWeight: 'blob',
      color: 'black'
    }}>JS</span>
  </div>

  return <div className={prefix}>
    <div className='btns'>
    </div>
    <div className='opts'>
      <Popover
        placement='bottom'
        content={<>
          Execute(<code>
            {isMacOS ? '⌘' : 'Ctrl'}
          </code> + <code>E</code>)
        </>}
        offset={[0, 6]}
      >
        <button className='excute'
                onClick={() => elBridgeP.send('run')}>
          <div className='cldr codicon codicon-play' />
        </button>
      </Popover>
      <Switcher lText={tsIcon}
                rText={jsIcon}
                value={language === 'js'}
                onChange={checked => onChangeLanguage(checked ? 'js' : 'ts')}
      />
    </div>
  </div>
}
