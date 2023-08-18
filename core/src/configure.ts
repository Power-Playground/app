import type { PluginConfigures } from './plugins'

export interface Configure {
  plugins?: Partial<PluginConfigures>
}

export function defineConfigure(configure?: Configure) {
  return configure
}
