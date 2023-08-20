import type { PluginConfigures } from './plugins'

export interface Configure {
  HeaderTitle?: string | (() => JSX.Element)
  headerTitleJumpLink?: string
  githubUrl?: string
  plugins?: Partial<PluginConfigures>
}

export function defineConfigure<T extends Configure>(configure?: T): T {
  return (configure ?? {}) as T
}
