import './devtools-init'

import * as Babel from '@babel/standalone'
import { defineDevtools, defineDevtoolsPanel, elBridgeC, getConfigure } from '@power-playground/core'

import { JSPanel } from './panels/javascript'
import { DTSPanel } from './panels/typescript'
import { Files, setFiles } from './files'
import { id } from './index.ts'

type TransformOptions = Parameters<typeof Babel.transform>[1]

declare module '@power-playground/core' {
  export interface OutputsPluginConfigures {
    babelTransformOptions?: Exclude<TransformOptions, 'filename'>
  }
}

const {
  babelTransformOptions = {}
} = getConfigure(id) ?? {}

// TODO More Panel
//   Errors
//   AST
export default defineDevtools({
  panels: [
    defineDevtoolsPanel('outputs.js', '.JS', 'react', JSPanel),
    defineDevtoolsPanel('outputs.d.ts', '.D.TS', 'react', DTSPanel)
  ],
  load() {
    let prevDisposeFunc: Function
    function addDisposeFunc(func?: Function) {
      const oldDisposeFunc = prevDisposeFunc
      prevDisposeFunc = () => {
        oldDisposeFunc?.()
        func?.()
      }
    }
    const disposeRun = elBridgeC.on('run', () => {
      Files.forEach(({ name, text: code }) => {
        if (name !== '/index.js') return

        // TODO support fileSystem
        try {
          prevDisposeFunc?.()
          addDisposeFunc(eval(
            `(function () { const module = { exports: {} }; const exports = module.exports; ${code}; return module.exports; })()`
          ).dispose)
        } catch (e) {
          console.error(e)
        }
      })
    })

    // TODO resolve babel plugins management
    const disposeCompileWatch = elBridgeC.on('compile-completed', files => {
      setFiles(files.map(({ name, text }) => {
        let code = text
        if (name.endsWith('.js')) {
          name = name.slice(7)
          try {
            code = Babel.transform(text, {
              presets: ['es2015'],
              ...babelTransformOptions,
              filename: name
            })?.code ?? ''
          } catch (e) {
            return {
              name: `${name} (compile error)`,
              originalText: text,
              // @ts-ignore
              text: e!.message!
            }
          }
        }
        return { name, originalText: text, text: code ?? '' }
      }))
    })
    return () => {
      disposeRun?.()
      disposeCompileWatch?.()
      prevDisposeFunc?.()
    }
  }
})
