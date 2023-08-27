import { Switcher } from '../../../components/base/Switcher'
import type { BarItemProps } from '../..'
import type { TypeScriptPluginX } from '..'

export const Langs: React.ComponentType<BarItemProps<TypeScriptPluginX['ExtShareState']>> = ({ shareState }) => {
  const { language, changeLanguage } = shareState
  const size = 26
  const iconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
  const tsIcon = <span style={iconStyle}>
    <img width={size} alt='typescript' src='https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' />
  </span>
  const jsIcon = <span style={iconStyle}>
    <img width={size} alt='javascript' src='https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' />
  </span>

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
