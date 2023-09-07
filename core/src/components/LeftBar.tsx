import './LeftBar.scss'

import { useEffect } from 'react'
import { classnames, messenger } from '@power-playground/core'

import PP from '../../../resources/PP_P.svg'

import { List } from './base/List'
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
    addPanel,
    removePanel,
    togglePanel
  } = useDrawerPanelController()

  useEffect(() => {
    addPanel({
      id: 'directory',
      icon: 'project',
      title: <>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          cursor: 'pointer',
          userSelect: 'none'
        }}>
          Project
          <span className='cldr codicon codicon-chevron-down' />
        </span>
      </>,
      actions: <>
        <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
          <span className='cldr codicon codicon-add'></span>
        </button>
        <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
          <span className='cldr codicon codicon-compass-dot'></span>
        </button>
      </>,
      content: <List />
    })
    return () => {
      removePanel('directory')
    }
  }, [addPanel, removePanel])
  return <div className={classnames(prefix, props.className)}
              style={props.style}>
    <div className={`${prefix}__top`}>
      <button
        className={classnames({ active: activePanel?.id === 'directory' })}
        onClick={() => togglePanel('directory')}
      >
        <span className='cldr codicon codicon-folder'></span>
        {/* TODO multiple files plugin */}
      </button>
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
