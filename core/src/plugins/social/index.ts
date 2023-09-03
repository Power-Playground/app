import { definePlugin } from '@power-playground/core'

import { Share } from './topbar/Share'

export default definePlugin({
  editor: {
    topbar: [Share]
  }
})
