import { defineConfigure } from '@power-playground/core'

import babelVar2const from './babel-plugins/var2const'

const aTestInitPackage = Object.entries(import.meta.glob([
  './a-test-init-package/**/*'
], {
  as: 'raw',
  eager: true
}))

export default defineConfigure({
  plugins: {
    outputs: {
      babelTransformOptions: {
        presets: ['es2016'],
        plugins: [babelVar2const]
      }
    },
    typescript: {
      extraFiles: aTestInitPackage.map(([filePath, content]) => ({
        filePath: `file:///${filePath.slice(2)}`,
        content
      })),
      extraModules: aTestInitPackage.map(([filePath, content]) => ({
        filePath: filePath.slice(2),
        content
      }))
    }
  }
})
