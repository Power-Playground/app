import react from '@vitejs/plugin-react'
import { configDotenv } from 'dotenv'
import fg from 'fast-glob'
import path from 'node:path'
import { defineConfig, normalizePath } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'
import { cdn } from 'vite-plugin-cdn2'
import { unpkg } from 'vite-plugin-cdn2/url.js'
import inspect from 'vite-plugin-inspect'

import replacer from './vite-plugins/replacer'

configDotenv()
configDotenv({
  path: path.resolve(process.cwd(), '.env.local')
})
const { NODE_ENV } = process.env
if (NODE_ENV === undefined) {
  console.warn('NODE_ENV not set, use "development" as default.')
  process.env.NODE_ENV = 'development'
}
configDotenv({
  path: path.resolve(process.cwd(), `.env.${
    NODE_ENV === 'development' ? 'dev' : 'pro'
  }`)
})

function relative(prev: '__DONT_USE_DIRNAME_AS_YOUR_DIRECTORY_NAME__' | (string & {}), p: string) {
  const np = path.relative(
    prev === '__DONT_USE_DIRNAME_AS_YOUR_DIRECTORY_NAME__'
      ? __dirname
      : path.resolve(__dirname, prev), p
  )
  if (np.startsWith('../')) {
    return np
  }
  return `./${np}`
}
const relativeSrc = relative.bind(null, './src')
const relativeDir = relative.bind(null, '__DONT_USE_DIRNAME_AS_YOUR_DIRECTORY_NAME__')

const __PPD_PLUGINS_GLOB_PATHS__ = [
  './src/plugins/*.ts*',
  './src/plugins/*/index.ts*',
  '../ppd-plugins/*.ts*',
  '../ppd-plugins/*/index.ts*',
  '../ppd-plugins/*.js*',
  '../ppd-plugins/*/index.js*'
].map(p => path.resolve(__dirname, p))

if (!process.env.PPD_CONFIGURE_PATH) {
  console.warn('PPD_CONFIGURE_PATH not set, use default configure path ".ppd.client.configure.ts".')
  console.warn(
    'If you are developing Power Playground, ' +
    'you can set PPD_CONFIGURE_PATH to "mock/.ppd.client.configure.ts" in `.env` file.'
  )
}
const __CLIENT_CONFIGURE_PATH__ = path.resolve(
  process.cwd(), process.env.PPD_CONFIGURE_PATH ?? '.ppd.client.configure.ts'
)

const pluginEntries = fg.globSync([
  './core/src/plugins/*.ts*',
  './core/src/plugins/*/index.ts*',
  '!./core/src/plugins/**/index.tsx',
  '!./core/src/plugins/**/configure.ts',
  ...__PPD_PLUGINS_GLOB_PATHS__.map(relativeDir)
])
  .reduce((acc, file) => {
    console.log(`Adding plugin: ${file}`)
    acc[
      `plugins/${
        file
          .replace(/\.[jt]sx?$/, '')
          .replace(/^\.\//, '')
          .replace('core/src/plugins/', 'core/')
          .replace('src/plugins/', 'inner/')
          .replace('ppd-plugins/', 'outer/')
      }`
    ] = normalizePath(path.resolve(__dirname, file))
    return acc
  }, {} as Record<string, string>)

// https://vitejs.dev/config/
export default defineConfig(async _ => ({
  base: `/${process.env.BASE_URL || 'app'}/`,
  plugins: [
    replacer({
      define: {
        PPD_HEADER_TITLE_JUMP_LINK: JSON.stringify(process.env.PPD_HEADER_TITLE_JUMP_LINK),
        PPD_GITHUB_URL: JSON.stringify(process.env.PPD_GITHUB_URL),

        __PPD_PLUGINS_GLOB_PATHS__: JSON.stringify(__PPD_PLUGINS_GLOB_PATHS__.map(relativeSrc)),
        __CLIENT_CONFIGURE_PATH__: JSON.stringify(relativeSrc(__CLIENT_CONFIGURE_PATH__))
      }
    }),
    react(),
    cdn({
      url: unpkg,
      modules:[
        { name: 'sentinel-js', relativeModule: './dist/sentinel.umd.js' },
        { name: '@babel/standalone', relativeModule: './babel.min.js' },
        { name: 'react', relativeModule: './umd/react.production.min.js' },
        { name: 'react-dom', relativeModule: './umd/react-dom.production.min.js', aliases: ['client'] },
        { name: 'jotai', relativeModule: './umd/index.production.js', spare: ['umd/vanilla.production.js', 'umd/react.production.js'] }
      ],
      transform() {
        return {
          script(node) {
            if (node.name === 'jotai') {
              if (node.url?.size) {
                const normal = Array.from( node.url.values())[0]
                node.url = new Set()
                node.extra.spare.forEach((el:string) => node.url?.add(new URL(`${node.extra.name}@${node.extra.version}/${el}`, unpkg).href))
                node.url.add(normal)
              }
            }
          }
        }
      }
    }),
    analyzer({ reportFileName:'stats.html' }),
    process.env.ENABLE_INJECT_ANALYTICS === 'true' ? inspect() : undefined
  ],
  publicDir: './core/public',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'eval-logs': path.resolve(__dirname, 'eval-logs.html'),
        core: path.resolve(__dirname, 'core/src/index.ts'),
        ...pluginEntries
      }
    }
  },
  define: {
    TYPESCRIPT_VERSIONS_META: await import('./core/src/utils').then(({ getTypescriptVersionMeta }) => getTypescriptVersionMeta())
  }
}))
