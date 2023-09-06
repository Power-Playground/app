import './DrawerPanel.scss'

import { useEffect, useRef, useState } from 'react'
import { classnames } from '@power-playground/core'

import { Menu } from './base/Menu'
import { Popover } from './base/Popover'
import { useDrawerPanelController } from './drawerPanelCreator'
import { Resizable } from '@power-playground/core/components/Resizable.tsx'

DrawerPanel.prefix = 'ppd-drawer-panel'
export function DrawerPanel() {
  const { prefix } = DrawerPanel
  const panelRef = useRef<HTMLDivElement>(null)

  const { activePanel, closePanel } = useDrawerPanelController()
  useEffect(() => {
    if (activePanel?.id) {
      panelRef.current?.focus()
    }
  }, [activePanel?.id])

  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const [windowMode, setWindowMode] = useState<'centered' | 'popout'>('popout')
  return <Resizable
    ref={panelRef}
    className={classnames(
      prefix,
      activePanel && `${prefix}--active`,
      menuIsOpen && `${prefix}--menu-open`,
      windowMode
    )}
    style={{ width: '300px' }}
    tabIndex={0}
    resizable={{ right: true }}
    onKeyDown={e => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        activePanel?.id && closePanel(activePanel?.id)
      }
    }}
    >
    {activePanel && <>
      <div className={`${prefix}__header`}>
        <div className={`${prefix}__header__title`}>
          <h3>
            {typeof activePanel?.icon === 'string'
              ? <span className={`cldr codicon codicon-${activePanel.icon}`}></span>
              : activePanel?.icon}
            {activePanel?.title}
          </h3>
        </div>
        <div className={`${prefix}__header__actions`}>
          {activePanel?.actions}
          <Menu
           items={[
             { id: 'switch-drawer-mode', content: <span style={{
               display: 'flex',
               alignItems: 'center',
               cursor: 'default'
             }}>
               Switch Drawer Mode
               &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
               <span
                 className='cldr codicon codicon-editor-layout'
                 style={{
                   cursor: 'pointer',
                   color: windowMode === 'popout' ? 'var(--primary)' : undefined
                 }}
                 onClick={e => (
                   e.stopPropagation(),
                   setWindowMode('popout')
                 )}
               />
               &nbsp;
               <span
                 className='cldr codicon codicon-layout-centered'
                 style={{
                   cursor: 'pointer',
                   color: windowMode === 'centered' ? 'var(--primary)' : undefined
                 }}
                 onClick={e => (
                   e.stopPropagation(),
                   setWindowMode('centered')
                 )}
               />
             </span> }
           ]}
           onVisibleChange={setMenuIsOpen}
          >
            <button>
              <span className='cldr codicon codicon-more' />
            </button>
          </Menu>
          <Popover
            content={<>
              Minimize
              <br />
              <kbd>Esc</kbd>
            </>}
            placement='right'>
            <button onClick={() => closePanel(activePanel.id)}>
              <span className='cldr codicon codicon-remove' />
            </button>
          </Popover>
        </div>
      </div>
      <div className={`${prefix}__body`}>
        {activePanel?.content}
      </div>
    </>}
  </Resizable>
}
