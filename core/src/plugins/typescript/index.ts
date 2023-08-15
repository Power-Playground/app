import { useEffect } from 'react'
import type { Editor } from '@power-playground/core'
import type * as monacoEditor from 'monaco-editor'

import { definePlugin } from '../'

import { Langs } from './Langs'
import { use } from './use'
import { Versions } from './Versions'

declare module '@power-playground/core' {
  export interface PluginConfigures {
    typescript: {
      compilerOptions?: monacoEditor.languages.typescript.CompilerOptions
    }
  }
}

const extraModules = Object
  .entries(Object.assign(
    {} as Record<string, string>, {}
  ))
  .reduce((acc, [filePath, content]) => acc.concat({
    filePath,
    content
  }), [] as { content: string, filePath: string }[])
let compilerOptions: monacoEditor.languages.typescript.CompilerOptions = {
  target: 4,
  moduleResolution: 2,
  declaration: true
}

export interface TypeScriptPluginX {
  ExtShareState: {
    typescriptVersion: string
    changeTypescriptVersion: (ts: string) => void
    language: 'javascript' | 'typescript'
    changeLanguage: (lang: 'javascript' | 'typescript') => void
  }
}

const editor: Editor<TypeScriptPluginX> = {
  use,
  useShare({
    curFilePath, language, typescriptVersion
  }, monaco) {
    useEffect(() => {
      if (!monaco || !typescriptVersion) return

      let defaults: monacoEditor.languages.typescript.LanguageServiceDefaults
      if (language === 'javascript') {
        defaults = monaco.languages.typescript.javascriptDefaults
      } else {
        defaults = monaco.languages.typescript.typescriptDefaults
      }
      extraModules.forEach(({ content, filePath }) => {
        monaco.editor.createModel(
          content,
          language === 'javascript' ? 'javascript' : 'typescript',
          monaco.Uri.parse(filePath)
        )
      })

      defaults.setCompilerOptions({ ...defaults.getCompilerOptions(), ...compilerOptions })

      console.group('monaco detail data')
      console.log('typescript.version', monaco.languages.typescript.typescriptVersion)
      console.log('typescript.CompilerOptions', monaco.languages.typescript.typescriptDefaults.getCompilerOptions())
      console.groupEnd()

      return () => {
        monaco.editor.getModels().forEach(model => {
          if (model.uri.path !== curFilePath) model.dispose()
        })
      }
    }, [monaco, curFilePath, language, typescriptVersion])
  },
  topbar: [Langs],
  statusbar: [Versions]
}

export default definePlugin<'typescript', TypeScriptPluginX>('typescript', conf => {
  if (conf?.compilerOptions) {
    compilerOptions = conf.compilerOptions
  }

  return { editor }
})
