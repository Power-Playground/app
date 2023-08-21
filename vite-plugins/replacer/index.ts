import type { FilterPattern, PluginOption } from 'vite'
import { createFilter } from 'vite'

export interface ReplacerOptions {
  /**
   * define replace rule map
   */
  define?: Record<string, string>
  /**
   * @default [/node_modules/, /\.(png|jpe?g|gif|svg|ico)$/i]
   */
  exclude?: FilterPattern
  /**
   * @default []
   */
  include?: FilterPattern
  /**
   * require declaration in the first line of code, like:
   * ```ts
   * // @replacer.use.define.__XXX__
   * ```
   * @default true
   */
  requireDeclaration?: boolean
}

// Node.js, image
export const defaultExclude = [
  /node_modules/,
  /\.(png|jpe?g|gif|svg|ico)$/i
]

export function replacer(options?: ReplacerOptions): PluginOption {
  if (!options) return

  const {
    define = {},
    exclude = defaultExclude,
    include = [],
    requireDeclaration = true
  } = options ?? {}
  const filter = createFilter(include, exclude)
  return {
    name: 'replacer',
    enforce: 'pre',
    transform(code, id) {
      if (!filter(id)) return
      if (code.startsWith('// @replacer.disable'))
        return

      let enableReplaceKeys = Object.keys(define)
      const singleLineCommentsInStart = [] as string[]
      let index = 0
      if (requireDeclaration) {
        let line = ''
        while (index < code.length) {
          const char = code[index]
          if (char === '\n') {
            if (line.startsWith('// @replacer.')) {
              singleLineCommentsInStart.push(line)
            } else {
              index = index - line.length
              break
            }
            line = ''
          } else {
            line += char
          }
          index++
        }
        if (singleLineCommentsInStart.length === 0) return

        const matchKeys = [] as string[]
        // resolve "@replacer.use.define.${key}"
        singleLineCommentsInStart.forEach(line => {
          const match = line.match(/\/\/ @replacer\.use\.define\.(\w+)/)
          if (match) {
            const key = match[1]
            if (define[key] !== undefined) {
              matchKeys.push(key)
            } else {
              console.warn(
                `${id}: ${line}\n`
                + `"${key}" is not defined in replacer options`
              )
            }
          }
        })
        enableReplaceKeys = matchKeys
      }
      code = code.slice(index)
      enableReplaceKeys.forEach(key => {
        code = code.replace(new RegExp(`\\b${key}\\b`, 'g'), define[key])
      })
      return code
    }
  }
}

export default replacer
