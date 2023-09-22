import { definePlugin } from '..'

import Project from './drawerPanels/Project'
import { Files } from './topbar/Files'

// TODO
//  - [ ] Virtual file system
//  - [ ] Active Tabs

// eslint-disable-next-line react-refresh/only-export-components
export default definePlugin({
  editor: {
    leftbar: [
      {
        id: Project.id,
        icon: 'folder',
        tooltip: 'Project - Display files structure',
        placeholder: <kbd>⌘ 1</kbd>
      }
    ],
    topbar: [Files],
    drawerPanels: [Project]
  }
})
