import react from '@vitejs/plugin-react'
import { configDotenv } from 'dotenv'
import fg from 'fast-glob'
import path from 'node:path'
import { defineConfig } from 'vite'
import { cdn } from 'vite-plugin-cdn2'
import { unpkg } from 'vite-plugin-cdn2/url.js'

configDotenv()

const pluginEntries = fg.globSync([
  './core/src/plugins/*.ts*',
  './core/src/plugins/*/index.ts*',
  '!./core/src/plugins/**/index.tsx',
  '!./core/src/plugins/**/configure.ts',
  './src/plugins/*.ts*',
  './src/plugins/*/index.ts*',
  '../ppd-plugins/*.ts*',
  '../ppd-plugins/*/index.ts*',
  '../ppd-plugins/*.js*',
  '../ppd-plugins/*/index.js*'
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
    ] = path.resolve(__dirname, file)
    return acc
  }, {} as Record<string, string>)

// https://vitejs.dev/config/
export default defineConfig(async _ => ({
  base: `/${process.env.BASE_URL || 'app'}/`,
  plugins: [
    react(),
    cdn({
      url: unpkg,
      modules:[
        { name: 'sentinel-js', relativeModule: './dist/sentinel.umd.js' },
        { name: '@babel/standalone', relativeModule: './babel.min.js' },
        { name: 'react', relativeModule: './umd/react.production.min.js' },
        { name: 'react-dom', relativeModule: './umd/react-dom.production.min.js' },
        { name: 'jotai', relativeModule: './umd/index.production.js' }
      ]
    })
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
