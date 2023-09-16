import './Project.scss'

import React, { useEffect, useRef } from 'react'
import { messenger } from '@power-playground/core'

import type { ListRef } from '../../../components/base/List'
import { List } from '../../../components/base/List'
import type { DrawerPanelProps } from '../../../components/drawerPanelCreator'
import { NotImplemented } from '../../../components/NotImplemented'

const prefix = 'ppd-drawer-panel--project'

export default function Project({ template }: DrawerPanelProps) {
  const listRef = useRef<ListRef>(null)
  useEffect(() => {
    template('title', <span>
      Project
      <span className='cldr codicon codicon-chevron-down' />
    </span>)
    template('actions', <>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-expand-all' />
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-collapse-all' />
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-compass-dot' />
      </button>
    </>)
    template('moreMenu', [
      {
        id: 'help',
        icon: 'question',
        label: 'Help',
        placeholder: <code>?(⇧ /)</code>,
        onClick: () => listRef.current?.help()
      }
    ])
  }, [template])
  return <List
    ref={listRef}
    selectable
    items={[
      {
        icon: 'file',
        id: 'index.ts',
        label: 'index.ts',
        placeholder: '[entry]'
      },
      {
        icon: 'file',
        id: 'index.js',
        label: 'index.js',
        indent: 1
      },
      {
        icon: 'file',
        id: 'index.d.ts',
        label: 'index.d.ts',
        indent: 1
      },
      {
        icon: 'folder-library',
        id: 'node_modules',
        label: 'node_modules',
        className: prefix + '--dir-type__external'
      }
    ]}
  />
}
Project.id = Project.icon = 'project'
