import './Project.scss'

import { messenger } from '@power-playground/core'

import { List } from '../../../components/base/List'
import type { DrawerPanel } from '../../../components/drawerPanelCreator'
import { NotImplemented } from '../../../components/NotImplemented'

export default {
  id: 'project',
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
  content: <List selectable />
} as DrawerPanel
