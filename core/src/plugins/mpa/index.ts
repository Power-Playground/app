import { definePlugin } from '..'

import Project from './drawerPanels/Project'

export default definePlugin({
  editor: {
    leftbar: [
      { id: Project.id, icon: 'folder' }
    ],
    drawerPanels: [Project]
  }
})
