import type * as TS from 'typescript'

export type NameSpacesChain = (
  & TS.ModuleDeclaration
  & { top: TS.ModuleDeclaration }
)[]

export const getNamespaces = (ts: typeof TS, code: string) => {
  const sourceFile = ts.createSourceFile('file.ts', code, ts.ScriptTarget.Latest, true)
  const namespaces: Record<string, NameSpacesChain> = {}
  const visit = (node: import('typescript').Node) => {
    if (ts.isModuleDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      if (node.body && ts.isModuleBlock(node.body)) {
        const namespaceChain = [node]
        let _node = node
        let parent = node.parent
        while (parent && ts.isModuleDeclaration(parent) && parent.name && ts.isIdentifier(parent.name)) {
          namespaceChain.unshift(parent)
          _node = parent
          parent = parent.parent
        }
        const namespaceChainNames = namespaceChain.map(n => n.name.text).join('.')
        if (!namespaces[namespaceChainNames]) {
          namespaces[namespaceChainNames] = []
        }

        namespaces[namespaceChainNames].push({
          ..._node,
          top: node
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return namespaces
}
