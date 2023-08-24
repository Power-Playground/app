// https://github.com/microsoft/TypeScript-Website/blob/4f7eb6497e8f1e3cbaec8e2919950ae37d08ee3d/packages/ata/src/index.ts#L157-L189
/**
 * Pull out any potential references to other modules (including relatives) with their
 * npm versioning start too if someone opts into a different version via an inline end of line comment
 */
export const getReferencesForModule = (ts: typeof import('typescript'), code: string) => {
  const meta = ts.preProcessFile(code)

  // Ensure we don't try to download TypeScript lib references
  // @ts-ignore - private but likely to never change
  const libMap: Map<string, string> = ts.libMap || new Map()

  // TODO: strip /// <reference path='X' />?

  console.log(meta)
  const references = meta.referencedFiles
    .concat(meta.importedFiles)
    .concat(meta.libReferenceDirectives)
    .filter(f => !f.fileName.endsWith('.d.ts'))
    .filter(d => !libMap.has(d.fileName))

  return references.map(r => {
    let version = undefined
    if (!r.fileName.startsWith('.')) {
      version = 'latest'
      const line = code.slice(r.end).split('\n')[0]!
      if (line.includes('// @version')) version = line.split('// @version')[1]!.trim()
    }

    return {
      module: r.fileName,
      version,
      position: [r.pos, r.end]
    }
  })
}
