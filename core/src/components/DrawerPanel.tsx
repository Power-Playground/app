import './DrawerPanel.scss'

import { useEffect, useRef } from 'react'
import { classnames } from '@power-playground/core'

import { Popover } from './base/Popover'
import { useDrawerPanelController } from './drawerPanelCreator'

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
  return <div
    ref={panelRef}
    className={classnames(
      prefix,
      activePanel && `${prefix}--active`
    )}
    tabIndex={0}
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
          <button>
            <span className='cldr codicon codicon-more' />
          </button>
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
  </div>
}
