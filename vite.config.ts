import path from 'node:path'

import react from '@vitejs/plugin-react'
import { configDotenv } from 'dotenv'
import { defineConfig } from 'vite'
import { viteExternalsPlugin } from 'vite-plugin-externals'

configDotenv()

// https://vitejs.dev/config/
export default defineConfig(async env => ({
  base: `/${process.env.BASE_URL}/`,
  plugins: [
    react(),
    env.mode === 'production' ? viteExternalsPlugin({
      '@babel/standalone': 'Babel',
      'react': 'React',
      'react-dom': 'ReactDOM'
    }) : null
  ],
  publicDir: './core/public',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'eval-logs': path.resolve(__dirname, 'eval-logs.html')
      }
    }
  },
  define: {
    TYPESCRIPT_VERSIONS_META: await import('./core/src/utils').then(({ getTypescriptVersionMeta }) => getTypescriptVersionMeta())
  }
}))
