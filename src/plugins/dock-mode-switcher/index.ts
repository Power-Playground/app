import { definePlugin } from '@power-playground/core'

export default definePlugin({
  devtools: ({ importInEvalLogs }) => importInEvalLogs(
    new URL(
      Object.values(import.meta.glob('./devtools.ts'))[0]
        .toString()
        .replace(/.*import\("(.+?)"\).*/, '$1'),
      import.meta.url
    ).href
  ).then(m => m.default)
})
