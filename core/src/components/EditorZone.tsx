import './EditorZone.scss'

import {
  useEffect,
  useMemo,
  useRef,
  useState } from 'react'
import loader from '@monaco-editor/loader'
import Editor, { useMonaco } from '@monaco-editor/react'
import type * as monacoEditor from 'monaco-editor'

import { elBridgeP } from '../eval-logs/bridge.ts'
import type { definePlugins } from '../plugins'
import { copyToClipboard } from '../utils'

import { History } from './bottom-status/History.tsx'
import { setCodeHistory } from './bottom-status/historyStore.ts'
import { TypescriptVersionStatus } from './bottom-status/TypescriptVersionStatus.tsx'
import { HelpDialog } from './editor-zone/HelpDialog.tsx'
import type { DialogRef } from './Dialog.tsx'
import { typescriptVersionMeta } from './editor.typescript.versions.ts'
import { Popover } from './Popover.tsx'
import { Resizable } from './Resizable.tsx'
import { Switcher } from './Switcher.tsx'

const isMacOS = navigator.platform.startsWith('Mac')

// TODO support filter plugins
const plugins = import.meta.glob('../plugins/*/index.ts*', {
  eager: true, import: 'default'
}) as Record<string, ReturnType<typeof definePlugins>>

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
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, function () {
    // 当光标位于第一行时触发
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, function () {
    // 当光标位于最后一行时触发
  })
  editor.focus()
}

export default function EditorZone() {
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
  function changeTypescriptVersion(ts: string) {
    setTypescriptVersion(ts)
    searchParams.set('ts', ts)
    const code = editorRef.current?.getValue()
    const hash = code ? '#' + btoa(encodeURIComponent(code)) : ''
    history.replaceState(null, '', '?' + searchParams.toString() + hash)
    // TODO refactor no reload
    location.reload()
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

    let defaults: monacoEditor.languages.typescript.LanguageServiceDefaults
    if (language === 'js') {
      defaults = monaco.languages.typescript.javascriptDefaults
    } else {
      defaults = monaco.languages.typescript.typescriptDefaults
    }
    defaults.setCompilerOptions({ ...defaults.getCompilerOptions(), ...compilerOptions })
    extraModules.forEach(({ content, filePath }) => {
      monaco.editor.createModel(
        content,
        language === 'js' ? 'javascript' : 'typescript',
        monaco.Uri.parse(filePath)
      )
    })

    console.group('monaco detail data')
    console.log('typescript.version', monaco.languages.typescript.typescriptVersion)
    console.log('typescript.CompilerOptions', monaco.languages.typescript.typescriptDefaults.getCompilerOptions())
    console.groupEnd()

    monaco.editor.addKeybindingRule({
      keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      command: 'editor.action.quickCommand'
    })
    const dispose = Object.values(plugins)
      .reduce(
        (acc, plugin) => plugin.editor
          ? acc.concat(plugin.editor?.(monaco))
          : acc,
        [] as Function[]
      )
    return () => {
      dispose.forEach(func => func())
      monaco.editor.getModels().forEach(model => {
        if (model.uri.path !== curFilePath) model.dispose()
      })
    }
  }, [curFilePath, language, monaco])
  const compileResultRef = useRef<monacoEditor.languages.typescript.EmitOutput>()
  useEffect(() => elBridgeP.on('compile', () => {
    if (!compileResultRef.current) return

    elBridgeP.send('compile-completed', compileResultRef.current.outputFiles)
  }), [])

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

  const helpDialogRef = useRef<DialogRef>(null)

  const tsIcon = <div style={{ position: 'relative', width: 24, height: 24, backgroundColor: '#4272ba' }}>
    <span style={{
      position: 'absolute',
      right: 1,
      bottom: -2,
      transform: 'scale(0.6)',
      fontWeight: 'blob'
    }}>TS</span>
  </div>
  const jsIcon = <div style={{ position: 'relative', width: 24, height: 24, backgroundColor: '#f2d949' }}>
    <span style={{
      position: 'absolute',
      right: 1,
      bottom: -2,
      transform: 'scale(0.6)',
      fontWeight: 'blob',
      color: 'black'
    }}>JS</span>
  </div>
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

  const [[line, column], setLineAndColumn] = useState<[number, number]>([0, 0])
  return <>
    <HelpDialog ref={helpDialogRef} />
    <Resizable
      className='editor-zone'
      style={{
        minWidth: 'var(--editor-min-width, 10%)',
        width: 'var(--editor-width, 50%)'
      }}
      resizable={{ right: true }}
      >
      <div className='menu'>
        <div className='btns' style={{ visibility: 'hidden' }}>
        </div>
        <div className='opts'>
          <Popover
            placement='bottom'
            content={<>
              Execute(<code>
                {isMacOS ? '⌘' : 'Ctrl'}
              </code> + <code>E</code>)
            </>}
            offset={[0, 6]}
          >
            <button className='excute'
                    onClick={() => elBridgeP.send('run')}>
              <div className='cldr codicon codicon-play' />
            </button>
          </Popover>
          <Switcher lText={tsIcon}
                    rText={jsIcon}
                    value={language === 'js'}
                    onChange={checked => changeLanguage(checked ? 'js' : 'ts')}
          />
        </div>
      </div>
      {typescriptVersion
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
            editor.onDidChangeModelContent(function compile() {
              const model = editor.getModel()
              if (model) {
                monaco?.languages.typescript.getTypeScriptWorker()
                  .then(worker => worker(model.uri))
                  .then(client => client.getEmitOutput(model.uri.toString()))
                  .then(result => {
                    compileResultRef.current = result
                    elBridgeP.send('compile-completed', result.outputFiles)
                  })
              }
              return compile
            }())
            const updateLineAndColumn = () => {
              const pos = editor.getPosition()
              if (pos) setLineAndColumn([pos.lineNumber, pos.column])
            }
            editor.onDidChangeCursorPosition(updateLineAndColumn)
            updateLineAndColumn()
            addCommands(editor, monaco)
          }}
        />}
      <div className='monaco-editor bottom-status'>
        <Popover
          style={{ cursor: 'pointer' }}
          offset={[0, 3]}
          content={<>
            Find Help(<code>
              {isMacOS ? '^' : 'Ctrl'}
            </code> + <code>/</code>)
          </>}
          onClick={() => helpDialogRef.current?.open()}
        >
          <div className='cldr codicon codicon-info' />
        </Popover>
        <History theme={theme} setCode={setCode} />
        <TypescriptVersionStatus
          value={typescriptVersion ?? searchParams.get('ts') ?? typescriptVersionMeta.versions[0]}
          onChange={changeTypescriptVersion}
        />
        <Popover style={{ cursor: 'pointer' }}
                 offset={[0, 3]}
                 content='Go to Line and Column'
                 onClick={() => {
                   if (!editorRef.current) return
                   editorRef.current.focus()
                   editorRef.current.trigger('editor', 'editor.action.quickCommand', {})
                 }}
        >
          <div className='line-and-column'>{line}:{column}</div>
        </Popover>
      </div>
    </Resizable>
  </>
}
