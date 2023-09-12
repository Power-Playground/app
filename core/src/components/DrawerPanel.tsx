import './DrawerPanel.scss'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { classnames } from '@power-playground/core'
import { useDebouncedValue } from 'foxact/use-debounced-value'

import { ExtensionContext } from '../contextes/Extension'

import { Menu } from './base/Menu'
import { Popover } from './base/Popover'
import { useDrawerPanelController } from './drawerPanelCreator'
import { Resizable } from './Resizable'

DrawerPanel.prefix = 'ppd-drawer-panel'
DrawerPanel.delay = 200
export function DrawerPanel() {
  const { prefix } = DrawerPanel
  const panelRef = useRef<HTMLDivElement>(null)

  const { plugins } = useContext(ExtensionContext)

  const drawerPanels = useMemo(() => plugins
    .filter(plugin => plugin.editor?.drawerPanels)
    .flatMap(plugin => plugin.editor?.drawerPanels ?? []), [plugins])
  const {
    activePanel,
    setPanel,
    removePanel,
    closePanel
  } = useDrawerPanelController()
  useEffect(() => {
    drawerPanels.forEach(panel => setPanel(panel))
    return () => drawerPanels.forEach(panel => removePanel(panel.id))
  }, [setPanel, removePanel, drawerPanels])

  useEffect(() => {
    if (activePanel?.id) {
      panelRef.current?.focus()
    }
  }, [activePanel?.id])
  const debouncedActivePanel = useDebouncedValue(activePanel, DrawerPanel.delay)
  const memoActivePanel = useMemo(() => activePanel
    ? activePanel
    : debouncedActivePanel, [
    activePanel,
    debouncedActivePanel
  ])

  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const [windowMode, setWindowMode] = useState<'centered' | 'popout'>('popout')
  return <Resizable
    _ref={panelRef}
    className={classnames(
      prefix,
      activePanel && `${prefix}--active`,
      menuIsOpen && `${prefix}--menu-open`,
      windowMode,
      activePanel?.id && `${prefix}--${activePanel?.id}`
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
    {memoActivePanel && <>
      <div className={`${prefix}__header`}>
        <div
          ref={e => e?.focus()}
          tabIndex={0}
          className={`${prefix}__header__title`}
        >
          <h3>
            {typeof memoActivePanel?.icon === 'string'
              ? <span className={`cldr codicon codicon-${memoActivePanel.icon}`}></span>
              : memoActivePanel?.icon}
            {memoActivePanel?.title}
          </h3>
        </div>
        <div className={`${prefix}__header__actions`}>
          {memoActivePanel?.actions}
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
            <button onClick={() => memoActivePanel && closePanel(memoActivePanel?.id)}>
              <span className='cldr codicon codicon-remove' />
            </button>
          </Popover>
        </div>
      </div>
      <div className={`${prefix}__body`}>
        {memoActivePanel?.content}
      </div>
    </>}
  </Resizable>
}
