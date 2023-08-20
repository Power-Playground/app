import { definePlugin } from '@power-playground/core'

import { GoToLC } from './statusbar/GoToLC'

export default definePlugin('edit-utils', conf => ({
  editor: {
    statusbar: [GoToLC],
    load(editor, monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
        editor.trigger('whatever', 'editor.action.gotoLine', {})
      })
      // try {
      //   monaco.editor.addKeybindingRule({
      //     command: 'editor.action.gotoLine',
      //     keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL
      //   })
      // } catch (e) {
      //   console.error(e)
      //   // support lower version monaco editor
      //   // TODO refactor as special version polyfill
      //   editor._standaloneKeybindingService.addDynamicKeybinding('GoToLC.id', monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      //     editor.trigger('whatever', 'editor.action.gotoLine', {})
      //   })
      // }
    }
  }
}))
