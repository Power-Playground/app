import { registerPluginConfigures } from '@power-playground/core'

import configure from './configure'

declare global {
  // eslint-disable-next-line no-var
  var __PPD_CONFIGURES__: typeof configure
}

registerPluginConfigures(configure.plugins)
window.__PPD_CONFIGURES__ = configure
