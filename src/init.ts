import { elBridgeP, registerPluginConfigures } from '@power-playground/core'

import configure from './configure'

declare global {
  // eslint-disable-next-line no-var
  var __PPD_CONFIGURES__: typeof configure
}

registerPluginConfigures(configure.plugins)
if (import.meta.hot) {
  window.__PPD_CONFIGURES__ = configure
  import.meta.hot.accept(() => {
    console.debug('configures updated')
    elBridgeP.send('hmr:plugins-update')
  })
}
window.__PPD_CONFIGURES__ = configure
