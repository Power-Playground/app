import './EditorZone.scss'

import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import type * as monacoEditor from 'monaco-editor'

import type { definePlugin, ShareState } from '../plugins'
import { classnames } from '../utils'

import { BottomStatus } from './bottom-status'
import { typescriptVersionMeta } from './editor.typescript.versions'
import type { ResizableProps } from './Resizable'
import { Resizable } from './Resizable'
import { TopBar } from './TopBar'

// TODO support filter plugins
const PLUGINS = import.meta
  .glob([
    '../plugins/*.ts*',
    '!../plugins/index.tsx',
    '../plugins/*/index.ts*'
  ], {
    eager: true, import: 'default'
  }) as Record<string, ReturnType<typeof definePlugin>>

interface MonacoScopeContextValue {
  monaco: typeof monacoEditor | null
  editorInstance: monacoEditor.editor.IStandaloneCodeEditor | null

  store: {
    code: [string, React.Dispatch<React.SetStateAction<string>>]
    theme: [string, React.Dispatch<React.SetStateAction<string>>]
    language: [string, (lang: string) => void]
    typescriptVersion: [string, (tsv: string) => void]
  }
}

export const MonacoScopeContext = createContext<MonacoScopeContextValue | null>(null)

const prefix = 'ppd-editor-zone'

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
  const searchParams = useRef(new URLSearchParams(location.search))
  const [editor, setEditor] = useState<monacoEditor.editor.IStandaloneCodeEditor | null>(null)

  const plugins = useMemo(() => Object.values(PLUGINS), [])
  const shareState = plugins
    .reduce((acc, plugin) => ({
      ...acc,
      ...plugin.editor?.use?.reduce((acc, use) => ({
        ...acc,
        ...use?.({ searchParams: searchParams.current, editor })
      }), {})
    }), {} as ShareState)
  const {
    code, setCode,
    loadingNode,
    curFilePath,
    language,
    changeLanguage,
    typescriptVersion,
    changeTypescriptVersion
  } = shareState
  if (setCode === undefined) {
    throw new Error('You must register a plugin to provide `setCode` function')
  }

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

    const dispose = plugins.map(plugin => plugin.editor?.preload?.(monaco))
    return () => dispose.forEach(func => func?.())
  }, [monaco, plugins])
  plugins
    .forEach(plugin => plugin.editor?.useShare?.(shareState, monaco))

  const [theme, setTheme] = useState<string>('light')
  useEffect(() => onThemeChange(setTheme), [])

  return <MonacoScopeContext.Provider value={{
    monaco,
    editorInstance: editor,
    store: {
      code: [code, setCode],
      theme: [theme, setTheme],
      language: [language, changeLanguage],
      typescriptVersion: [
        typescriptVersion ?? searchParams.current.get('ts') ?? typescriptVersionMeta.versions[0],
        changeTypescriptVersion
      ]
    }
  }}>
    <Resizable
      className={classnames(prefix, props.className)}
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
      <TopBar />
      {loadingNode ?? <Editor
        key={typescriptVersion}
        language={language}
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
          plugins
            .forEach(plugin => plugin.editor?.load?.(editor, monaco))
          setEditor(editor)
          editor.focus()
        }}
      />}
      <BottomStatus />
    </Resizable>
  </MonacoScopeContext.Provider>
}
