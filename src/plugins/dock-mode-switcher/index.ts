import { definePlugin } from '@power-playground/core'

export default definePlugin({
  devtools: () => import('./devtools').then(m => m.default)
})
