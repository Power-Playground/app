import './LeftBar.scss'

import { useContext, useMemo } from 'react'
import { classnames, messenger } from '@power-playground/core'

import PP from '../../../resources/PP_P.svg'
import { ExtensionContext } from '../contextes/Extension'

import { Tooltip } from './base/Tooltip'
import { useDrawerPanelController } from './drawerPanelCreator'
import { NotImplemented } from './NotImplemented'

const prefix = 'ppd-left-bar'

export interface LeftBarProps {
  style?: React.CSSProperties
  className?: string
}

export function LeftBar(props: LeftBarProps) {
  const {
    activePanel,
    togglePanel
  } = useDrawerPanelController()

  const { plugins } = useContext(ExtensionContext)

  const leftbarItems = useMemo(() => plugins
    .filter(plugin => plugin.editor?.leftbar)
    .flatMap(plugin => plugin.editor?.leftbar ?? []), [plugins])
  const topItems = useMemo(() => leftbarItems.filter(item => (
    item.placement === undefined ||
    item.placement === 'top'
  )), [leftbarItems])
  const bottomItems = useMemo(() => leftbarItems.filter(item => (
    item.placement === 'bottom'
  )), [leftbarItems])
  const buildElements = (items: typeof leftbarItems) => items.map(({ id, tooltip, placeholder, icon }) => {
    const btn = <button
      key={id}
      className={classnames({ active: activePanel?.id === id })}
      onClick={() => togglePanel(id)}
      >
      {typeof icon === 'string'
        ? <span className={`cldr codicon codicon-${icon}`}></span>
        : icon}
    </button>
    const tooltipProps = typeof tooltip === 'string' && placeholder
      ? { contentText: tooltip, contentPlaceholder: placeholder }
      : { content: tooltip }
    return tooltip && placeholder
      ? <Tooltip key={id}
                 placement='right'
                 offset={[0, 8]}
                 {...tooltipProps}>
        {btn}
      </Tooltip>
      : btn
  })

  return <div className={classnames(prefix, props.className)}
              style={props.style}>
    <div className={`${prefix}__top`}>
      {buildElements(topItems)}
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-heart'></span>
        {/* TODO snippets */}
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-source-control'></span>
        {/* TODO code timeline */}
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-book'></span>
        {/* TODO examples and documents */}
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-extensions'></span>
        {/* TODO extensions marketplace */}
      </button>
    </div>
    <div className={`${prefix}__bottom`}>
      {buildElements(bottomItems)}
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-account'></span>
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-gear'></span>
      </button>
      <img src={PP} alt='Power Playground menu icon.' />
    </div>
  </div>
}
