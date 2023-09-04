import * as fs from 'node:fs'
import * as path from 'node:path'
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

  const transform = (code: string, id: string) => {
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
  return {
    name: 'replacer',
    enforce: 'pre',
    transform,
    config(config) {
      let plugins = config.optimizeDeps?.esbuildOptions?.plugins
      if (!config.optimizeDeps) {
        config.optimizeDeps = {}
      }
      if (!config.optimizeDeps.esbuildOptions) {
        config.optimizeDeps.esbuildOptions = {}
      }
      if (!plugins) {
        plugins = config.optimizeDeps.esbuildOptions.plugins = []
      }

      plugins.push({
        name: 'replacer',
        setup({ onLoad, esbuild }) {
          onLoad({ filter: /.*/ }, async args => {
            const id = args.path
            if (!filter(id)) return undefined

            const code = transform(
              await fs.promises.readFile(id, 'utf-8').then(code => code.toString()), id
            )
            if (!code) return undefined
            let ext = path.extname(id).slice(1)
            if (ext === 'mjs') ext = 'js'

            // use esbuild to transform code, because it will skip transform if return contents
            // https://esbuild.github.io/plugins/#on-load-results:~:text=If%20this%20is%20set%2C%20no%20more%20on%2Dload%20callbacks%20will%20be%20run%20for%20this%20resolved%20path.
            const loader = config.optimizeDeps?.esbuildOptions?.loader?.[`.${ext}`] || ext
            return {
              loader: 'js',
              contents: (await esbuild.transform(code, {
                loader: loader as any
              })).code
            }
          })
        }
      })
    }
  }
}

export default replacer
