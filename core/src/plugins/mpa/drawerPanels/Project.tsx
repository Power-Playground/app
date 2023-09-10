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
      <span className='cldr codicon codicon-expand-all' />
    </button>
    <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
      <span className='cldr codicon codicon-collapse-all' />
    </button>
    <button onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}>
      <span className='cldr codicon codicon-compass-dot' />
    </button>
  </>,
  content: <List
    selectable
    items={[
      { icon: 'file',
        id: 'index.ts',
        label: 'index.ts',
        placeholder: '[entry] very longerrrrrrrrrrrrrrrrrrrrrr placeholder' },
      { icon: 'beaker',
        id: 'index.spec.ts',
        label: 'index.spec.ts',
        placeholder: '[entry] test' },
      { icon: 'file',
        id: 'tsconfig.json',
        label: 'tsconfig.json' },
      { icon: 'file',
        id: '0',
        label: 'foo bar.js' },
      { icon: 'file',
        id: '1',
        label: 'foobar.js' },
      { icon: 'file',
        id: '2',
        label: 'bar.js' },
      ...[...Array(100)].map((_, i) => ({
        icon: i % 3 !== 2 ? 'folder' : 'file',
        id: `item-${i}`,
        label: `Item ${i}`,

        indent: i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2
      })),
      { icon: 'folder-library',
        id: 'node_modules',
        label: 'node_modules' }
    ]} />
} as DrawerPanel
