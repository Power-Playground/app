import './EditorZone.scss'

import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import loader from '@monaco-editor/loader'
import Editor, { useMonaco } from '@monaco-editor/react'
import type * as monacoEditor from 'monaco-editor'

import { elBridgeP } from '../eval-logs/bridge'
import type { definePlugin, Dispose } from '../plugins'
import { classnames, copyToClipboard } from '../utils'

import { setCodeHistory } from './bottom-status/historyStore'
import { BottomStatus } from './bottom-status'
import { typescriptVersionMeta } from './editor.typescript.versions'
import type { ResizableProps } from './Resizable'
import { Resizable } from './Resizable'
import { TopBar } from './TopBar'

// TODO support filter plugins
const plugins = import.meta
  .glob([
    '../plugins/*.ts*',
    '!../plugins/index.tsx',
    '../plugins/*/index.ts*'
  ], {
    eager: true, import: 'default'
  }) as Record<string, ReturnType<typeof definePlugin>>

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

function addCommands(
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: typeof monacoEditor
) {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    const code = editor.getValue()
    history.pushState(null, '', '#' + btoa(encodeURIComponent(code)))
    copyToClipboard(location.href)
    editor.focus()
    setCodeHistory(old => old.concat({
      code,
      time: Date.now()
    }))
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => elBridgeP.send('run'))
  editor.focus()
}

interface MonacoScopeContextValue {
  monaco: typeof monacoEditor | null
  editorInstance: monacoEditor.editor.IStandaloneCodeEditor | null

  store: {
    code: [string, React.Dispatch<React.SetStateAction<string>>]
    theme: [string, React.Dispatch<React.SetStateAction<string>>]
    typescriptVersion: [string, (tsv: string) => void]
  }
}

export const MonacoScopeContext = createContext<MonacoScopeContextValue | null>(null)

export default function EditorZone(props: {
  style?: React.CSSProperties & {
    '--editor-width'?: unknown
    '--editor-min-width'?: unknown
    '--editor-max-width'?: unknown
    '--editor-height'?: unknown
    '--editor-min-height'?: unknown
    '--editor-max-height'?: unknown
  }
  className?: string
  resizable?: ResizableProps['resizable']
}) {
  const searchParams = new URLSearchParams(location.search)

  const [language, setLanguage] = useState<'js' | 'ts'>(
    searchParams.get('lang') === 'js' ? 'js' : 'ts'
  )
  function changeLanguage(lang: 'js' | 'ts') {
    setLanguage(lang)
    searchParams.set('lang', lang)
    history.replaceState(null, '', '?' + searchParams.toString() + location.hash)
  }
  const curFilePath = useMemo(() => `/index.${language}`, [language])

  const [typescriptVersion, setTypescriptVersion] = useState<string>()
  const isFirstSetTypescriptVersion = useRef(true)
  function changeTypescriptVersion(ts: string) {
    setTypescriptVersion(ts)
    searchParams.set('ts', ts)
    const code = editorRef.current?.getValue()
    const hash = code ? '#' + btoa(encodeURIComponent(code)) : ''
    history.replaceState(null, '', '?' + searchParams.toString() + hash)

    if (isFirstSetTypescriptVersion.current) {
      isFirstSetTypescriptVersion.current = false
    } else {
      location.reload()
    }
  }

  const hash = location.hash.slice(1)
  const [code, setCode] = useState<string>(hash
    ? decodeURIComponent(atob(hash))
    : 'console.log("Hello world!")'
  )

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>(null)

  const monaco = useMonaco()
  useEffect(() => {
    if (!monaco) return

    try {
      monaco.editor.addKeybindingRule({
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        command: 'editor.action.quickCommand'
      })
    } catch (e) {
      console.error(e)
    }

    const dispose = Object.values(plugins)
      .reduce(
        (acc, plugin) => plugin.editor?.preload
          ? acc.concat(plugin.editor?.preload(monaco))
          : acc,
        [] as Dispose[]
      )
    return () => dispose.forEach(func => func())
  }, [monaco])
  useEffect(() => {
    if (!monaco || !typescriptVersion) return

    let defaults: monacoEditor.languages.typescript.LanguageServiceDefaults
    if (language === 'js') {
      defaults = monaco.languages.typescript.javascriptDefaults
    } else {
      defaults = monaco.languages.typescript.typescriptDefaults
    }
    extraModules.forEach(({ content, filePath }) => {
      monaco.editor.createModel(
        content,
        language === 'js' ? 'javascript' : 'typescript',
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
  }, [curFilePath, language, monaco, typescriptVersion])

  typescriptVersion && loader.config({
    paths: { vs: `https://typescript.azureedge.net/cdn/${typescriptVersion}/monaco/min/vs` }
  })
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
    window.addEventListener('error', onResourceLoadError, true)
    return () => window.removeEventListener('error', onResourceLoadError)
  }, [typescriptVersion])

  const [theme, setTheme] = useState<string>('light')
  useEffect(() => onThemeChange(setTheme), [])

  const loadingNode = <section style={{
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
  </section>

  return <MonacoScopeContext.Provider value={{
    monaco,
    editorInstance: editorRef.current,
    store: {
      code: [code, setCode],
      theme: [theme, setTheme],
      typescriptVersion: [
        typescriptVersion ?? searchParams.get('ts') ?? typescriptVersionMeta.versions[0],
        changeTypescriptVersion
      ]
    }
  }}>
    <Resizable
      className={classnames('editor-zone', props.className)}
      style={{
        ...props.style,
        width: 'var(--editor-width, 50%)',
        minWidth: 'var(--editor-min-width)',
        maxWidth: 'var(--editor-max-width)',
        height: 'var(--editor-height, 50%)',
        minHeight: 'var(--editor-min-height)',
        maxHeight: 'var(--editor-max-height)'
      }}
      resizable={props.resizable ?? { right: true }}
      >
      <TopBar language={language} onChangeLanguage={changeLanguage} />
      {!typescriptVersion
        ? loadingNode
        : <Editor
          key={typescriptVersion}
          language={{
            js: 'javascript',
            ts: 'typescript'
          }[language]}
          options={{
            automaticLayout: true,
            scrollbar: {
              vertical: 'hidden',
              verticalSliderSize: 0,
              verticalScrollbarSize: 0
            }
          }}
          theme={theme === 'light' ? 'vs' : 'vs-dark'}
          loading={loadingNode}
          path={`file://${curFilePath}`}
          value={code}
          onChange={code => setCode(code ?? '')}
          onMount={(editor, monaco) => {
            // @ts-ignore
            editorRef.current = editor
            Object.values(plugins)
              .forEach(plugin => plugin.editor?.load?.(editor, monaco))
            addCommands(editor, monaco)
          }}
        />}
      <BottomStatus />
    </Resizable>
  </MonacoScopeContext.Provider>
}
