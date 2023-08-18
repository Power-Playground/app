// @replacer.use.define.PPD_HEADER_TITLE_JUMP_LINK
// @replacer.use.define.PPD_GITHUB_URL

import type { Configure } from '@power-playground/core'
import { registerPluginConfigures } from '@power-playground/core'

import configure from './configure'

declare global {
  // eslint-disable-next-line no-var
  export var __PPD_CONFIGURES__: Configure
}

registerPluginConfigures(configure.plugins ?? {})
window.__PPD_CONFIGURES__ = {
  ...configure,
  headerTitleJumpLink: PPD_HEADER_TITLE_JUMP_LINK ?? configure.headerTitleJumpLink,
  githubUrl: PPD_GITHUB_URL ?? configure.githubUrl
}
