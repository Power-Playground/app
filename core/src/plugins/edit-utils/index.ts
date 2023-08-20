import { definePlugin } from '@power-playground/core'

import { GoToLC } from './statusbar/GoToLC'

export default definePlugin('edit-utils', conf => ({
  editor: {
    statusbar: [GoToLC]
  }
}))
