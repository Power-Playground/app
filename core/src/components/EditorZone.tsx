import './EditorZone.scss'

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { displayLeftBarAtom } from '@power-playground/core/components/EditorZoneShareAtoms.ts'
import { LeftBar } from '@power-playground/core/components/LeftBar.tsx'
import { useAtom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'

import { ExtensionContext } from '../contextes/Extension'
import { MonacoScopeContext } from '../contextes/MonacoScope'
import type { Plugin, ShareState } from '../plugins'
import { classnames } from '../utils'

import { BottomStatus } from './bottom-status'
import type { ResizableProps } from './Resizable'
import { Resizable } from './Resizable'
import { TopBar } from './TopBar'

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
  plugins?: Record<string, Plugin | undefined>
}) {
  const searchParams = useRef(new URLSearchParams(location.search))
  const [editor, setEditor] = useState<monacoEditor.editor.IStandaloneCodeEditor | null>(null)

  const plugins = useMemo(() => Object
    .values(props.plugins ?? {})
    .filter(<T, >(v: T | undefined): v is T => !!v), [props.plugins])
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
    language
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

    const dispose = plugins.map(plugin => plugin?.editor?.preload?.(monaco))
    return () => dispose.forEach(func => func?.())
  }, [monaco, plugins])
  plugins
    .forEach(plugin => plugin?.editor?.useShare?.(shareState, monaco))

  const [theme, setTheme] = useState<string>('light')
  useEffect(() => onThemeChange(setTheme), [])

  const [displayLeftBar] = useAtom(displayLeftBarAtom)

  return <ExtensionContext.Provider value={{
    searchParams: searchParams.current,
    plugins, shareState
  }}>
    <MonacoScopeContext.Provider value={{
      monaco,
      editorInstance: editor,
      store: {
        code: [code, setCode],
        theme: [theme, setTheme]
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
        {/* TODO support display animation */}
        {displayLeftBar && <LeftBar />}
        <div className={`${prefix}__container`}>
          <TopBar />
          {loadingNode ?? <Editor
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
        </div>
      </Resizable>
    </MonacoScopeContext.Provider>
  </ExtensionContext.Provider>
}
