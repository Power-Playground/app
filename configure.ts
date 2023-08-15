import { definePluginConfigures } from '@power-playground/core'

import babelVar2const from './.ppd-dev/babel.var2const.ts'

export default {
  plugins: definePluginConfigures({
    outputs: {
      babelTransformOptions: {
        presets: ['es2016'],
        plugins: [babelVar2const]
      }
    }
  })
}
