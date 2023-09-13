import { definePlugin } from '..'

import Project from './drawerPanels/Project'
import { Files } from './topbar/Files'

export default definePlugin({
  editor: {
    leftbar: [
      { id: Project.id, icon: 'folder' }
    ],
    topbar: [Files],
    drawerPanels: [Project]
  }
})
