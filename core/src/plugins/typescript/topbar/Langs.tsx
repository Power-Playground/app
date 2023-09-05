import './Langs.scss'

import { Menu } from '../../../components/base/Menu'
import type { BarItemProps } from '../..'
import type { TypeScriptPluginX } from '..'

const prefix = 'ppd-plugins-typescript-topbar-langs'
export const Langs: React.ComponentType<BarItemProps<TypeScriptPluginX['ExtShareState']>> = ({ shareState }) => {
  const { language, changeLanguage } = shareState
  const size = 26

  return <Menu
    style={{ order: -100 }}
    className={prefix}
    items={[
      {
        id: 'typescript',
        title: 'TypeScript',
        content: <span className={`${prefix}__mi`}>
          <img width={size} alt='typescript' src='https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' />
          TypeScript
        </span>
      },
      {
        id: 'javascript',
        title: 'JavaScript',
        content: <span className={`${prefix}__mi`}>
          <img width={size} alt='javascript' src='https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' />
          JavaScript
        </span>
      }
    ]}
    onSelect={item => changeLanguage?.(item.id as 'typescript' | 'javascript')}
    >
    <img alt={language}
         src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${language}/${language}-original.svg`}
    />
  </Menu>
}
