import { useEffect, useMemo } from 'react'
import type { Editor } from '@power-playground/core'
import { atom, getDefaultStore, useAtom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'
import { mergeAll } from 'ramda'

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

const store = getDefaultStore()

export const compilerOptionsAtom = atom<
  monacoEditor.languages.typescript.CompilerOptions
>({
  target: 4,
  moduleResolution: 2,
  declaration: true,
  lib: ['esnext', 'dom', 'esnext.disposable']
})

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
    const [compilerOptions] = useAtom(compilerOptionsAtom)
    const defaults = useMemo(() => {
      if (!monaco || !typescriptVersion) return

      if (language === 'javascript') {
        return monaco.languages.typescript.javascriptDefaults
      } else {
        return monaco.languages.typescript.typescriptDefaults
      }
    }, [language, monaco, typescriptVersion])
    useEffect(() => {
      if (!defaults || !monaco) return

      defaults.setCompilerOptions({ ...defaults.getCompilerOptions(), ...compilerOptions })

      console.group('monaco detail data')
      console.log('typescript.version', monaco.languages.typescript.typescriptVersion)
      console.log('typescript.CompilerOptions', monaco.languages.typescript.typescriptDefaults.getCompilerOptions())
      console.groupEnd()
    }, [compilerOptions, defaults, monaco])
    useEffect(() => {
      if (!defaults || !monaco) return

      extraModules.forEach(({ content, filePath }) => {
        monaco.editor.createModel(
          content,
          language === 'javascript' ? 'javascript' : 'typescript',
          monaco.Uri.parse(filePath)
        )
      })

      return () => {
        monaco.editor.getModels().forEach(model => {
          if (model.uri.path !== curFilePath) model.dispose()
        })
      }
    }, [monaco, curFilePath, language, defaults])
  },
  topbar: [Langs],
  statusbar: [Versions]
}

export default definePlugin<'typescript', TypeScriptPluginX>('typescript', conf => {
  if (conf?.compilerOptions) {
    store.set(compilerOptionsAtom, mergeAll([
      compilerOptionsAtom.init,
      conf.compilerOptions
    ]))
  }

  return { editor }
})
