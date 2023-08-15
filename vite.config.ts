import react from '@vitejs/plugin-react'
import { configDotenv } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import { cdn } from 'vite-plugin-cdn2'
import { unpkg } from 'vite-plugin-cdn2/url.js'

configDotenv()

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
        { name: 'react-dom', relativeModule: './umd/react-dom.production.min.js' }
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
        ...fs.readdirSync(path.resolve(__dirname, 'core/src/plugins')).reduce((acc, file) => {
          acc[`plugins/${file.replace(/\.[jt]sx?$/, '')}`] = path.resolve(__dirname, `core/src/plugins/${file}`)
          return acc
        }, {} as Record<string, string>)
      }
    }
  },
  define: {
    TYPESCRIPT_VERSIONS_META: await import('./core/src/utils').then(({ getTypescriptVersionMeta }) => getTypescriptVersionMeta())
  }
}))
