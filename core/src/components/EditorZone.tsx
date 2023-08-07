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

import { TypescriptVersionStatus } from './bottom-status/TypescriptVersionStatus.tsx'
import { HelpDialog } from './editor-zone/HelpDialog.tsx'
import { HistoryDialog } from './editor-zone/HistoryDialog.tsx'
import type { DialogRef } from './Dialog.tsx'
import { typescriptVersionMeta } from './editor.typescript.versions.ts'
import { useCodeHistory } from './EditorZone_CodeHistory.ts'
import { Switcher } from './Switcher.tsx'

const examples = {
  base: {
    js: 'console.log("Hello world!")',
    ts: 'console.log("Hello world!")'
  }
}

const BORDER_SIZE = 5
const DOUBLE_CLICK_WIDTH = '500px'

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

function copyToClipboard(text: string) {
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

function addCommands(
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: typeof monacoEditor,
  addHistory: (code: string) => void
) {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    const code = editor.getValue()
    history.pushState(null, '', '#' + btoa(encodeURIComponent(code)))
    copyToClipboard(location.href)
    editor.focus()
    addHistory(code)
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
  const [code, setCode] = useState<string>(hash ? decodeURIComponent(atob(hash)) : examples.base[language])

  const [exampleName, setExampleName] = useState<string>(!hash ? 'base' : '')

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>(null)
  const effectFuncs = useRef<Function[]>([])

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
  const historyDialogRef = useRef<DialogRef>(null)

  const [, codeHistoryDispatch] = useCodeHistory()

  const [[line, column], setLineAndColumn] = useState<[number, number]>([0, 0])
  return <div className='editor-zone'
              ref={async ele => {
                // wait monaco editor mount
                let el: HTMLDivElement

                do {
                  await new Promise(re => setTimeout(re, 100))
                  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                  el = ele?.querySelector<HTMLDivElement>(':scope > section > div')!
                } while (el?.innerText === 'Loading...')
                if (!el) return

                let mPos: number
                let isClick = false

                function resize(e: MouseEvent) {
                  const dx = e.x - mPos
                  const newWidth = (parseInt(getComputedStyle(el, '').width) + dx)

                  mPos = e.x
                  // set width with !important
                  el.style.setProperty('width', newWidth + 'px', 'important')
                  el.style.minWidth = '5px'
                }
                function elMouseDown(e: MouseEvent) {
                  if (e.offsetX > el.offsetWidth - BORDER_SIZE) {
                    mPos = e.x
                    if (!isClick) {
                      isClick = true
                      setTimeout(() => isClick = false, 1000)
                    } else {
                      el.style.width = DOUBLE_CLICK_WIDTH
                    }
                    document.querySelectorAll('iframe').forEach(e => {
                      e.style.pointerEvents = 'none'
                    })
                    document.addEventListener('mousemove', resize, false)
                    el.style.userSelect = 'none'
                  }
                }
                function onGlobalMouseUp() {
                  el.style.userSelect = 'auto'
                  document.removeEventListener('mousemove', resize, false)
                  document.querySelectorAll('iframe').forEach(e => {
                    e.style.pointerEvents = 'auto'
                  })
                }

                effectFuncs.current.forEach(func => func())
                effectFuncs.current = []
                el.addEventListener('mousedown', elMouseDown, false)
                document.addEventListener('mouseup', onGlobalMouseUp)
                // 使用 ref + el 的方式会在热载（或其他组件重载的情况下）后产生副作用未被收集的问题
                // 在这里我们可以注册一个副作用数组，在每次卸载的时候将副作用清理一遍
                effectFuncs.current.push(() => {
                  el.removeEventListener('mousedown', elMouseDown)
                  document.removeEventListener('mouseup', onGlobalMouseUp)
                })
              }}>
    <HelpDialog ref={helpDialogRef} />
    <HistoryDialog
      theme={theme}
      ref={historyDialogRef}
      onChange={ch => setCode(ch.code)}
    />
    <div className='menu'>
      <div className='btns'>
        <button className='excute' onClick={() => elBridgeP.send('run')}>
          Execute
        </button>
        <button className='history' onClick={() => historyDialogRef.current?.open()}>
          History
        </button>
        <button className='help' onClick={() => helpDialogRef.current?.open()}>
          Help
        </button>
      </div>
      <div className='opts'>
        <select
          value={exampleName}
          onChange={e => {
            const value = e.target.value
            // @ts-ignore
            const example = examples[value]?.[language]
            if (!example) {
              alert('示例暂未添加')
              e.target.value = exampleName
              return
            }
            setCode(example)
            setExampleName(value)
          }}>
          <option value='base'>基本示例</option>
          <option value='await.opts'>控制流</option>
          <option value='middleware'>中间件</option>
          <option value='Make number awaitabler'>数字也可以！</option>
          <option value='Make `await <number>` abortable'>终止对数字的等待</option>
        </select>
        <Switcher lText={<div style={{ position: 'relative', width: 24, height: 24, backgroundColor: '#4272ba' }}>
          <span style={{
                      position: 'absolute',
                      right: 1,
                      bottom: -2,
                      transform: 'scale(0.6)',
                      fontWeight: 'blob'
                    }}>TS</span>
        </div>}
                  rText={<div style={{ position: 'relative', width: 24, height: 24, backgroundColor: '#f2d949' }}>
                    <span style={{
                      position: 'absolute',
                      right: 1,
                      bottom: -2,
                      transform: 'scale(0.6)',
                      fontWeight: 'blob',
                      color: 'black'
                    }}>JS</span>
                  </div>}
                  value={language === 'js'}
                  onChange={checked => {
                    if (!hash) {
                      // @ts-ignore
                      const example = examples[exampleName]?.[checked ? 'js' : 'ts']
                      if (!example) {
                        alert('示例暂未添加')
                        return
                      }
                      setCode(example)
                    }
                    changeLanguage(checked ? 'js' : 'ts')
                  }}
        />
      </div>
    </div>
    {typescriptVersion
      ? <div className='fetching'>Fetching...</div>
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
        loading={<div style={{
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
            : <span>Downloading TypeScript@<code>{typescriptVersion}</code> ...</span>}
        </div>}
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
          addCommands(editor, monaco, code => codeHistoryDispatch({ type: 'add', code }))
        }}
      />}
    <div className='monaco-editor bottom-status'>
      <TypescriptVersionStatus
        value={typescriptVersion ?? searchParams.get('ts') ?? typescriptVersionMeta.versions[0]}
        onChange={changeTypescriptVersion}
      />
      <div className='line-and-column'
           onClick={() => {
             if (!editorRef.current) return
             editorRef.current.focus()
             editorRef.current.trigger('editor', 'editor.action.quickCommand', {})
           }}
      >
        {line}:{column}
      </div>
    </div>
  </div>
}
