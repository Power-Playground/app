import './TopBar.scss'

import { useContext, useMemo } from 'react'

import { ExtensionContext, MonacoScopeContext } from './EditorZone.tsx'
import { Switcher } from './Switcher.tsx'

const prefix = 'ppd-top-bar'

export function TopBar() {
  const { plugins, ...rest } = useContext(ExtensionContext)

  const topBarItems = useMemo(() => plugins
    .filter(plugin => plugin.editor?.topbar)
    .flatMap(plugin => plugin.editor?.topbar ?? []), [plugins])

  const { store: {
    language: [language, onChangeLanguage] = []
  } = {} } = useContext(MonacoScopeContext) ?? {}
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
    {topBarItems.map((Item, i) => <Item key={i} {...rest} />)}
    <div className='btns'>
    </div>
    <div className='opts'>
      <Switcher lText={tsIcon}
                rText={jsIcon}
                value={language === 'javascript'}
                onChange={checked => onChangeLanguage?.(checked ? 'javascript' : 'typescript')}
      />
    </div>
  </div>
}
