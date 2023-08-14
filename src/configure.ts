import { definePluginConfigures } from '@power-playground/core'

export default definePluginConfigures({
  outputs: {
    babelTransformOptions: {
      presets: ['es2015']
    }
  }
})
