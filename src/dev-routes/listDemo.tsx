// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@vscode/codicons/dist/codicon.css'

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { List } from '../../core/src/components/base/List'

export default function ListDemo () {
  return <List
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
      }
    ]}
  />
}
