import './Files.scss'

import { useEffect, useMemo, useRef } from 'react'

import { classnames } from '../../../utils'
import type { BarItemProps } from '../..'
import { useTabs } from '../atoms'

const prefix = 'mpa__topbar__files'

export const Files: React.ComponentType<BarItemProps> = () => {
  const { tabs, addTab } = useTabs()
  const addOnlyOnce = useRef(false)
  useEffect(() => {
    if (addOnlyOnce.current) return

    addOnlyOnce.current = true
    if (tabs.length === 0) {
      // TODO only editor mounted?
      addTab({ id: 'index.ts', title: 'index.ts', icon: 'file', active: true })
    }
  }, [addTab, tabs.length])
  const activeTabId = useMemo(() => tabs.find(tab => tab.active)?.id, [tabs])
  return <div className={prefix}>
    {tabs.map(tab => <div
      key={tab.id}
      className={classnames(`${prefix}-tab`, { active: tab.id === activeTabId })}
    >
      {tab.icon && <span className={`cldr codicon codicon-${tab.icon}`} />}
      {tab.title}
      <span className='cldr codicon codicon-close' />
    </div>)}
    <div className={`${prefix}-full`} />
  </div>
}
