import type { Plugin } from './'

type Plugins = Record<string, Plugin>

export default import.meta.glob([
  './plugins/*.ts*',
  '!./plugins/index.tsx',
  '!./plugins/configure.ts',
  './plugins/*/index.ts*'
], {
  eager: true, import: 'default'
}) as Plugins
