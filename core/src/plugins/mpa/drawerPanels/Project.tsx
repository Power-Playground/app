import './Project.scss'

import { messenger } from '@power-playground/core'

import { List } from '../../../components/base/List'
import type { DrawerPanelProps } from '../../../components/drawerPanelCreator'
import { NotImplemented } from '../../../components/NotImplemented'

const prefix = 'ppd-drawer-panel--project'

export default function Project({ Template }: DrawerPanelProps) {
  return <>
    <Template name='actions'>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-expand-all' />
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-collapse-all' />
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
        <span className='cldr codicon codicon-compass-dot' />
      </button>
    </Template>
    <List
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
      ]} />
  </>
}
Project.id = Project.icon = 'project'
