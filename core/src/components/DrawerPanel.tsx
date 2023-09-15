import './DrawerPanel.scss'

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { classnames } from '@power-playground/core'
import { useDebouncedValue } from 'foxact/use-debounced-value'
import { useRetimer } from 'foxact/use-retimer'

import { ExtensionContext } from '../contextes/Extension'
import { useMenu } from '../hooks/useMenu.tsx'

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
      setTimeout(() => panelRef.current?.focus(), 10)
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
  const setMenuIsOpenDelayRetimer = useRetimer()
  const setMenuIsOpenDelay = useCallback((isOpen: boolean) => {
    setMenuIsOpenDelayRetimer(setTimeout(
      () => setMenuIsOpen(isOpen),
      200
    ) as unknown as number)
  }, [setMenuIsOpenDelayRetimer])
  const [windowMode, setWindowMode] = useState<'centered' | 'popout'>('popout')

  const moreMenuRef = useRef<HTMLButtonElement>(null)
  const moreMenu = useMenu(moreMenuRef.current, [
    {
      id: 'switch-drawer-mode',
      icon: windowMode === 'popout' ? 'editor-layout' : 'layout-centered',
      label: 'Switch Drawer Mode',
      children: [
        { id: 'switch-drawer-mode.popout', icon: 'editor-layout', label: 'Popout' },
        { id: 'switch-drawer-mode.centered', icon: 'layout-centered', label: 'Centered' }
      ]
    },
    {
      id: 'help',
      icon: 'question',
      label: 'Help',
      placeholder: <code>?(⇧ /)</code>
    }
  ], {
    onVisibleChange: v => v ? setMenuIsOpen(true) : setMenuIsOpenDelay(false),
    onTrigger: async item => {
      switch (item.id) {
        case 'switch-drawer-mode.popout':
          setWindowMode('popout')
          break
        case 'switch-drawer-mode.centered':
          setWindowMode('centered')
          break
        case 'help':
          break
      }
    }
  })
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
        <div className={`${prefix}__header__title`}>
          <h3>
            {typeof memoActivePanel?.icon === 'string'
              ? <span className={`cldr codicon codicon-${memoActivePanel.icon}`}></span>
              : memoActivePanel?.icon}
            {memoActivePanel?.title}
          </h3>
        </div>
        <div className={`${prefix}__header__actions`}>
          {memoActivePanel?.actions}
          {moreMenu.popper}
          <button
            ref={moreMenuRef}
            onClick={() => moreMenu.changeVisible(true)}
          >
            <span className='cldr codicon codicon-more' />
          </button>
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
