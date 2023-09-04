import './devtools-init'

import * as Babel from '@babel/standalone'
import { defineDevtools, defineDevtoolsPanel, elBridgeC, getPluginConfigure } from '@power-playground/core'

import { JSPanel } from './panels/javascript'
import { DTSPanel } from './panels/typescript'
import { Files, setFiles } from './files'
import { id } from './index'

type TransformOptions = Parameters<typeof Babel.transform>[1]

declare module '@power-playground/core' {
  export interface OutputsPluginConfigures {
    babelTransformOptions?: Exclude<TransformOptions, 'filename'>
  }
}

const {
  babelTransformOptions = {}
} = getPluginConfigure(id) ?? {}

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
          addDisposeFunc((0, eval)(
            `(function () { const module = { exports: {} }; const exports = module.exports; ${code}; return module.exports; })()`
          ).dispose)
        } catch (e) {
          console.error(e)
        }
      })
    })

    // TODO resolve babel plugins management
    const disposeCompileWatch = elBridgeC.on('compile-completed', files => {
      const filesEntries = Object.entries(files)
      const newFilesState = filesEntries
        .reduce((acc, [_path, { originalText, outputFiles }]) => acc.concat(outputFiles.map(({ name, text, tsCompilerResultText }) => {
          if (name.endsWith('.js')) {
            name = name.slice(7)
            try {
              return {
                name,
                text: Babel.transform(text, {
                  presets: ['es2015'],
                  ...babelTransformOptions,
                  filename: name
                })?.code ?? '',
                editorText: originalText,
                tsCompilerResultText
              }
            } catch (e) {
              return {
                name: `${name} (compile error)`,
                originalText: text,
                // @ts-ignore
                text: e!.message!,
                editorText: originalText,
                tsCompilerResultText
              }
            }
          }
          return { name, text, editorText: originalText, tsCompilerResultText }
        })),
        [] as typeof Files)
      setFiles(newFilesState)
    })
    return () => {
      disposeRun?.()
      disposeCompileWatch?.()
      prevDisposeFunc?.()
    }
  }
})
