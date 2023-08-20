import { definePlugin } from '@power-playground/core'

import { History } from './satusbar/History'

declare module '@power-playground/core' {
  interface PluginConfigures {
    'history-for-local': {
      /**
       * @default Infinity
       */
      maxLength: number
    }
  }
}

export default definePlugin('history-for-local', conf => ({
  editor: {
    statusbar: [History]
  }
}))
