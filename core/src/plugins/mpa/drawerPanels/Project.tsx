import './Project.scss'

import React, { useEffect, useMemo, useRef } from 'react'
import { messenger } from '@power-playground/core'

import type { ListRef } from '../../../components/base/List'
import { List } from '../../../components/base/List'
import type { DrawerPanelProps } from '../../../components/drawerPanelCreator'
import { NotImplemented } from '../../../components/NotImplemented'
import { useMenu } from '../../../hooks/useMenu'
import { useVFiles } from '../../../virtual-files'

const prefix = 'ppd-drawer-panel--project'

export default function Project({ template, setOnKeydown }: DrawerPanelProps) {
  const listRef = useRef<ListRef>(null)

  useEffect(() => {
    setOnKeydown(e => {
      if (e && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        listRef.current?.focus()
        e.preventDefault()
        e.stopPropagation()
      }
    })
  }, [setOnKeydown])
  const viewModeSwitcherRef = useRef<HTMLButtonElement>(null)
  const {
    popper: viewModeSwitcherMenuPopper,
    changeVisible: changeViewModeSwitcherVisible
  } = useMenu(viewModeSwitcherRef.current, [
    {
      id: 'project',
      icon: 'project',
      label: 'Project'
    },
    {
      id: 'files',
      icon: 'files',
      label: 'Files'
    }
  ])
  useEffect(() => {
    template('title', <button
      ref={viewModeSwitcherRef}
      onClick={() => changeViewModeSwitcherVisible(v => !v)}
      >
      Project
      <span className='cldr codicon codicon-chevron-down' />
    </button>)
  }, [changeViewModeSwitcherVisible, template])
  useEffect(() => {
    template('actions', <>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-compass-dot' />
      </button>
      <button onClick={() => listRef.current?.fold(undefined, true)}>
        <span className='cldr codicon codicon-collapse-all' />
      </button>
      <button onClick={() => listRef.current?.fold(undefined, false)}>
        <span className='cldr codicon codicon-expand-all' />
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

  const [vFiles] = useVFiles()
  const filesForListItem = useMemo(() => vFiles.map(f => ({
    icon: !f.isDirectory ? 'file' : {
      'node_modules': 'folder-library'
    }[f.basename] ?? 'folder',
    id: f.path,
    indent: f.path.split('/').length - 2,
    label: f.filename,
    placeholder: {
      'node_modules': '[external]'
    }[f.basename],
    className: {
      'node_modules': prefix + '--dir-type__external'
    }[f.basename]
  })), [vFiles])
  return <>
    {viewModeSwitcherMenuPopper}
    <List
      ref={listRef}
      selectable
      items={filesForListItem}
      defaultFoldedIds={['/node_modules']}
    />
  </>
}
Project.id = Project.icon = 'project'
