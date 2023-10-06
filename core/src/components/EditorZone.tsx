import './EditorZone.scss'

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { createStore, Provider, useAtom } from 'jotai'
import type * as monacoEditor from 'monaco-editor'

import { ExtensionContext } from '../contextes/Extension'
import { MonacoScopeContext } from '../contextes/MonacoScope'
import { useDocumentEventListener } from '../hooks/useDocumentEventListener'
import type { IStandaloneCodeEditor, Plugin, ShareState } from '../plugins'
import { classnames, isMacOS } from '../utils'

import { Popover } from './base/Popover'
import type { ResizableProps } from './base/Resizable'
import { Resizable } from './base/Resizable'
import { BottomStatus } from './BottomStatus'
import { DrawerPanel } from './DrawerPanel'
import { displayLeftBarAtom } from './EditorZoneShareAtoms'
import { LeftBar } from './LeftBar'
import { TopBar } from './TopBar'

const prefix = 'ppd-editor-zone'

export interface EditorZoneProps extends Pick<ResizableProps, 'onBorderBtnClick'> {
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
  enableMenuSwitch?: boolean
}

// TODO resolve remove plugin hook dispose logic
export default function EditorZone(props: EditorZoneProps) {
  const {
    enableMenuSwitch = true
  } = props
  const searchParams = useRef(new URLSearchParams(location.search))
  const editorStore = useMemo(() => createStore(), [])
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

    const dispose = plugins.map(plugin => plugin?.editor?.preload?.(monaco, editorStore))
    return () => dispose.forEach(func => func?.())
  }, [monaco, plugins, editorStore])
  useEffect(() => {
    if (!monaco || !editor) return

    const _editor = editor as IStandaloneCodeEditor
    try {
      monaco.editor.addKeybindingRule({
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        command: 'editor.action.quickCommand'
      })
    } catch (e) {
      console.error(e)
      // support lower version monaco editor
      // TODO refactor as special version polyfill
      const keybindings = _editor._standaloneKeybindingService.getKeybindings()
      // remove old keybinding
      const index = keybindings.findIndex(kb => kb.command === 'editor.action.quickCommand')
      if (index !== -1) {
        keybindings.splice(index, 1)
      }
      _editor._standaloneKeybindingService.addDynamicKeybinding(
        'editor.action.quickCommand',
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        () => {
          editor.trigger('whatever', 'editor.action.quickCommand', {})
        }
      )
    }
  }, [editor, monaco])
  plugins
    .forEach(plugin => plugin?.editor?.useShare?.(shareState, monaco))

  const [theme, setTheme] = useState<string>('light')
  useEffect(() => onThemeChange(setTheme), [])

  const [displayLeftBar, setDisplayLeftBar] = useAtom(displayLeftBarAtom)

  const editorCursorPosition = useRef<monacoEditor.Position | null>(null)

  useEffect(() => {
    if (editor) {
      // restore cursor position
      editor.setPosition(editorCursorPosition.current ?? { lineNumber: 1, column: 1 })
      editor.focus()

      return () => {
        // save current cursor position
        editorCursorPosition.current = editor.getPosition() ?? null
      }
    }
  }, [language, editor])

  useEffect(() => {
    if (!monaco || !editor) return

    const dispose = plugins
      .map(plugin => {
        const loadRT = plugin?.editor?.load?.(
          editor as IStandaloneCodeEditor,
          monaco
        )
        if (typeof loadRT === 'function') {
          return loadRT
        }
        if (Array.isArray(loadRT)) {
          return loadRT.reduce(
            (acc, func) => () => (acc?.(), func?.()),
            () => void 0
          )
        }
      })
    return () => dispose.forEach(func => func?.())
  }, [monaco, editor, plugins])

  useDocumentEventListener('keydown', e => {
    if (e.key === '\\' && (e.metaKey || e.ctrlKey)) {
      setDisplayLeftBar(!displayLeftBar)
    }
  })

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
      <Provider store={editorStore}>
        <Resizable
          className={classnames(prefix, props.className)}
          style={{
            ...props.style,
            '--border-scale': 5,
            width: 'var(--editor-width, 50%)',
            minWidth: 'var(--editor-min-width)',
            maxWidth: 'var(--editor-max-width)',
            height: 'var(--editor-height, 50%)',
            minHeight: 'var(--editor-min-height)',
            maxHeight: 'var(--editor-max-height)'
          }}
          resizable={props.resizable ?? { right: true }}
          onBorderBtnClick={props.onBorderBtnClick}
          onResized={el => localStorage.setItem('zone-width', el.style.width)}
        >
          {enableMenuSwitch && <Popover
            placement='right'
            className={classnames(`${prefix}__menu-switch`, {
              'is-active': displayLeftBar
            })}
            content={<>
              {displayLeftBar ? 'Hide activity bar' : 'Show activity bar'}
              <br />
              <kbd>{isMacOS ? '⌘' : 'Ctrl'} + \</kbd>
            </>}
            onClick={() => setDisplayLeftBar(!displayLeftBar)}
          >
            <span
              className={classnames(
                'cldr codicon',
                !displayLeftBar
                  ? 'codicon-layout-activitybar-left'
                  : 'codicon-menu'
              )}
            />
          </Popover>}
          {/* TODO support display animation */}
          <LeftBar
            style={{
              width: displayLeftBar ? undefined : 0,
              padding: displayLeftBar ? undefined : 0
            }}
          />
          <DrawerPanel />
          <div className={`${prefix}__container`}>
            <TopBar
              className={enableMenuSwitch && displayLeftBar ? 'is-active' : undefined}
            />
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
              onMount={editor => (setEditor(editor), editor.focus())}
            />}
            <BottomStatus />
          </div>
        </Resizable>
      </Provider>
    </MonacoScopeContext.Provider>
  </ExtensionContext.Provider>
}
