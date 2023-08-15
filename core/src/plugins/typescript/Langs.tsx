import { Switcher } from '../../components/Switcher'
import type { BarItemProps } from '..'

import type { TypeScriptPluginX } from '.'

export const Langs: React.ComponentType<BarItemProps<TypeScriptPluginX['ExtShareState']>> = ({ shareState }) => {
  const { language, changeLanguage } = shareState
  const size = 26
  const transformStyle: React.CSSProperties = {
    position: 'absolute',
    right: 4,
    bottom: 1,
    fontWeight: 'blob'
  }
  const tsIcon = <div style={{ position: 'relative', width: size, height: size, backgroundColor: '#4272ba' }}>
    <span style={transformStyle}>TS</span>
  </div>
  const jsIcon = <div style={{ position: 'relative', width: size, height: size, backgroundColor: '#f2d949' }}>
    <span style={{ ...transformStyle, color: 'black' }}>JS</span>
  </div>

  return <Switcher
    style={{
      '--gap': '0px',
      '--bor-size': '3px',
      order: -100,
      alignSelf: 'end'
    }}
    lText={tsIcon}
    rText={jsIcon}
    value={language === 'javascript'}
    onChange={checked => changeLanguage?.(checked ? 'javascript' : 'typescript')}
  />
}
