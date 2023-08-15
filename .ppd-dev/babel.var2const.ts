import { declare } from '@babel/helper-plugin-utils'

export default declare(() => ({
  name: 'babel.var2const',
  visitor: {
    VariableDeclaration(path) {
      if (path.node.kind === 'var') {
        path.node.kind = 'const'
      }
    }
  }
}))
