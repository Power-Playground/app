import type monaco from 'monaco-editor'

import { createSetVFileByStore } from '../../virtual-files'
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
    drawerPanels: [Project],
    preload: (monaco, store) => {
      const setVFileByStore = createSetVFileByStore(store)

      function setVFileByModel(model: monaco.editor.ITextModel) {
        const uri = model.uri
        if (uri) {
          console.log(uri, model.getValue())
          setVFileByStore({
            path: uri.path,
            contents: model.getValue()
          }, undefined)
        }
      }
      monaco.editor.onDidCreateModel(setVFileByModel)
      monaco.editor.getModels().forEach(setVFileByModel)
    }
  }
})
