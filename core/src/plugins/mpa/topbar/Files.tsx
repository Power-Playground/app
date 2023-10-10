import './Files.scss'

import type { ReactNode } from 'react'
import { useState } from 'react'

import type { BarItemProps } from '../..'

const prefix = 'mpa__topbar__files'

interface Tab {
  id: string
  icon?: string | ReactNode
  title: ReactNode
}

export const Files: React.ComponentType<BarItemProps> = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'index.ts', title: 'index.ts', icon: 'file' },
    { id: 'index.spec.ts', title: 'index.spec.ts', icon: 'beaker' }
  ])
  return <div className={prefix}>
    {tabs.map(tab => <div className={`${prefix}-tab`} key={tab.id}>
      {tab.icon && typeof tab.icon === 'string'
        ? <span className={`cldr codicon codicon-${tab.icon}`} />
        : tab.icon}
      {tab.title}
      <span className='cldr codicon codicon-close' />
    </div>)}
    <div className={`${prefix}-full`} />
  </div>
}
