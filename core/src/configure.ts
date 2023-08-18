import type { PluginConfigures } from './plugins'

export interface Configure {
  headerTitle?: React.ReactNode
  headerTitleJumpLink?: string
  githubUrl?: string
  plugins?: Partial<PluginConfigures>
}

export function defineConfigure(configure?: Configure) {
  return configure
}
