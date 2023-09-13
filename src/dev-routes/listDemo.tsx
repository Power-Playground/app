// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@vscode/codicons/dist/codicon.css'
import './listDemo.scss'

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { List } from '../../core/src/components/base/List'

export default function ListDemo () {
  return <List
    selectable
    items={[
      {
        icon: 'file',
        id: 'item0',
        label: 'item0',
        placeholder: '[entry]'
      },
      {
        id: 'item1',
        label: 'item1'
      },
      {
        id: 'item2',
        label: 'item2'
      }
    ]}
  />
}
