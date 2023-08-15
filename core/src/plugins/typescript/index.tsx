import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import loader from '@monaco-editor/loader'
import type * as monacoEditor from 'monaco-editor'

import { definePlugin } from '../index.tsx'

import { Langs } from './Langs.tsx'
import { Versions } from './Versions.tsx'

const extraModules = Object
  .entries(Object.assign(
    {} as Record<string, string>, {}
  ))
  .reduce((acc, [filePath, content]) => acc.concat({
    filePath,
    content
  }), [] as { content: string, filePath: string }[])
const compilerOptions: monacoEditor.languages.typescript.CompilerOptions = {
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

export default definePlugin<TypeScriptPluginX>({
  editor: {
    use: [({ searchParams, editor }) => {
      const [typescriptVersion, setTypescriptVersion] = useState<string>()
      const isFirstSetTypescriptVersion = useRef(true)
      const changeTypescriptVersion = useCallback((ts: string) => {
        loader.config({
          paths: { vs: `https://typescript.azureedge.net/cdn/${ts}/monaco/min/vs` }
        })
        setTypescriptVersion(ts)
        searchParams.set('typescript', ts)

        const computeCode = editor?.getValue()

        const hash = computeCode ? '#' + btoa(encodeURIComponent(computeCode)) : location.hash
        history.replaceState(null, '', '?' + searchParams.toString() + hash)

        if (isFirstSetTypescriptVersion.current) {
          isFirstSetTypescriptVersion.current = false
        } else {
          location.reload()
        }
      }, [editor, searchParams])

      const [language, setLanguage] = useState<'javascript' | 'typescript'>(
        searchParams.get('lang') === 'javascript' ? 'javascript' : 'typescript'
      )
      function changeLanguage(lang: 'javascript' | 'typescript') {
        setLanguage(lang)
        searchParams.set('lang', lang)
        history.replaceState(null, '', '?' + searchParams.toString() + location.hash)
      }
      const curFilePath = useMemo(() => `/index.${
        language === 'javascript' ? 'js' : 'ts'
      }`, [language])

      const [loadError, setLoadError] = useState<string>()
      useEffect(() => {
        function onResourceLoadError(e: ErrorEvent) {
          if (e.target instanceof HTMLScriptElement) {
            const src = e.target.src
            if (src.startsWith('https://typescript.azureedge.net/cdn/')) {
              setLoadError(`TypeScript@${typescriptVersion} unavailable`)
            }
          }
        }
        addEventListener('error', onResourceLoadError, true)
        return () => removeEventListener('error', onResourceLoadError)
      }, [typescriptVersion])

      const loadingNode = useMemo(() => typescriptVersion ? null : <section style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          position: 'relative',
          width: 72,
          height: 72,
          backgroundColor: '#4272ba',
          userSelect: 'none'
        }}>
          <span style={{
            position: 'absolute',
            right: 5,
            bottom: -2,
            fontSize: 30,
            fontWeight: 'blob'
          }}>TS</span>
        </div>
        {loadError
          ? <span>{loadError}</span>
          : <span>Downloading TypeScript{typescriptVersion && <>@<code>{typescriptVersion}</code></>} ...</span>}
      </section>, [loadError, typescriptVersion])

      return {
        curFilePath,
        typescriptVersion,
        changeTypescriptVersion,
        language,
        changeLanguage,
        loadingNode
      }
    }],
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
})
