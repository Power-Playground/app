import { definePluginConfigures } from '@power-playground/core'

let extConfigures: ReturnType<typeof definePluginConfigures>
if (import.meta.env.VITE_PPD_DEV === 'true') {
  extConfigures = import.meta.glob('../configure.ts', {
    eager: true
  })
    ?.['../configure.ts']
    // @ts-ignore
    ?.default as ReturnType<typeof definePluginConfigures>
} else {
  extConfigures = import.meta.glob('../../.ppd_configure.ts', {
    eager: true
  })
    ?.['../../.ppd_configure.ts']
    // @ts-ignore
    ?.default as ReturnType<typeof definePluginConfigures>
}

export default {
  plugins: definePluginConfigures({
    outputs: {
      babelTransformOptions: {
        presets: ['es2015']
      }
    }
  }),
  ...extConfigures
}
