import { defineConfigure } from '@power-playground/core'

import babelVar2const from './babel-plugins/var2const'

export default defineConfigure({
  plugins: {
    outputs: {
      babelTransformOptions: {
        presets: ['es2016'],
        plugins: [babelVar2const]
      }
    }
  }
})
