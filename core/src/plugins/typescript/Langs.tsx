import { Switcher } from '../../components/Switcher'
import { defineBarItem } from '..'

import type { TypeScriptPluginX } from './index'

export const Langs = defineBarItem<TypeScriptPluginX['ExtShareState']>(({ shareState }) => {
  const { language, changeLanguage } = shareState
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

  return <Switcher
    lText={tsIcon}
    rText={jsIcon}
    value={language === 'javascript'}
    onChange={checked => changeLanguage?.(checked ? 'javascript' : 'typescript')}
  />
})
