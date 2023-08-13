import type * as UITypes from '//chii/ui/legacy/legacy.js'

import type { ReactElement } from 'react'
import React, { createContext, useContext, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import type * as MonacoEditor from 'monaco-editor'

import type { DevtoolsWindow } from '../eval-logs/extension-support'

type TraverseNextNode = (stayWithin?: Node) => Node | null

export type Render = (devtoolsWindow: DevtoolsWindow, UI: typeof UITypes) => typeof UITypes.Widget.Widget
export type ReactRenderProps = {
  devtoolsWindow: DevtoolsWindow,
  UI: typeof UITypes,
  onTraverseNextNode: (lis: TraverseNextNode) => () => void
}
export type ReactRender = (props: ReactRenderProps) => ReactElement

type PanelMeta = {
  id: string
  type?: 'react'
  title: string
}

type Panel = PanelMeta & Render

function isReactRender(
  tuple: readonly [type: string, render: Render | ReactRender]
): tuple is ['react', ReactRender] {
  const [type, render] = tuple
  return type === 'react' && typeof render === 'function'
}

export interface ImportsContextValue {
  get: DevtoolsWindow['simport']
}

export const ImportsContext = createContext<ImportsContextValue | null>(null)

export function useImports<
  const Paths extends string[]
>(...paths: Paths) {
  const pathsRef = React.useRef(paths)
  if (pathsRef.current.some((path, i) => path !== paths[i])) {
    pathsRef.current = paths
  }
  const [modules, setModules] = React.useState<
    Record<Paths[number], unknown>
  >({} as any)
  const { get } = useContext(ImportsContext) ?? { get: () => Promise.reject() }
  useEffect(() => {
    const paths = pathsRef.current

    let isMounted = true
    async function load() {
      const mods = await Promise.all(paths.map(path => get(path)))
      if (!isMounted) return

      const newModules = mods.reduce<Record<Paths[number], unknown>>((acc, mod, i) => {
        acc[paths[i] as Paths[number]] = mod
        return acc
      }, {} as Record<Paths[number], unknown>)
      setModules(newModules)
    }
    load()
    return () => { isMounted = false }
  }, [get, pathsRef.current])
  return modules
}

export function defineDevtoolsPanel(
  id: string, title: string, render: Render
): PanelMeta & Render
export function defineDevtoolsPanel(
  id: string, title: string, type: 'react', render: ReactRender
): PanelMeta & Render & { type: 'react' }
export function defineDevtoolsPanel(
  id: string, title: string, typeOrRender: string | Render, render?: Render | ReactRender
): Panel {
  if (typeof typeOrRender === 'string') {
    if (!render)
      throw new Error('render is required')

    const tuple = [typeOrRender, render] as const
    if (isReactRender(tuple)) {
      const [type, Render] = tuple
      const newRender: Render = (devtoolsWindow, UI) => {
        return class extends UI.Widget.Widget {
          constructor() {
            super()
            const root = document.createElement('div') as HTMLDivElement & {
              traverseNextNode(stayWithin?: Node): Node | null
            }
            root.traverseNextNode = () => null

            this.element.appendChild(root)
            const cache = new Map()
            ReactDOM.createRoot(root)
              .render(<ImportsContext.Provider value={{
                async get(url) {
                  if (cache.has(url)) return cache.get(url)
                  const mod = await devtoolsWindow.simport(url)
                  cache.set(url, mod)
                  return mod
                }
              }}>
                <Render {...{
                  UI,
                  devtoolsWindow,
                  onTraverseNextNode: lis => {
                    root.traverseNextNode = lis
                    return () => root.traverseNextNode = () => null
                  }
                }} />
              </ImportsContext.Provider>)
          }
        }
      }
      return Object.assign(newRender, { id, type, title })
    }
    throw new Error('render must be a function')
  }
  const rtRender = typeOrRender as PanelMeta & Render
  rtRender.id = id
  rtRender.title = title
  return rtRender
}

export type Dispose = () => void

export interface ShareState {
  code: string
  setCode: React.Dispatch<React.SetStateAction<string>>
  language: string
  curFilePath: string
  loadingNode: React.ReactNode
}

export type UseFunction<T = unknown> = (props: {
  editor: MonacoEditor.editor.IStandaloneCodeEditor | null
  searchParams: URLSearchParams
}) => Partial<ShareState & T> | void

export interface BarItemProps<S> {
  searchParams: URLSearchParams
  shareState: Partial<ShareState & S>
}

export const defineBarItem: <S>(Comp: React.ComponentType<BarItemProps<S>>) => typeof Comp = comp => comp

export type Devtools = {
  panels?: Panel[]
  drawerPanels?: Panel[]
  load?: (props: {
    UI: typeof UITypes
    inspectorView: UITypes.InspectorView.InspectorView
    devtoolsWindow: DevtoolsWindow
  }) => Dispose | void
  beforeMount?: (props: {
    devtoolsWindow: DevtoolsWindow
  }) => Dispose | void
}

export type Plugin<X extends {
  ExtShareState: unknown
} = {
  ExtShareState: unknown
}> = {
  editor?: {
    /**
     * use tuple wrap the function which is mean to check by `eslint-plugin-react-hooks`
     */
    use?: [UseFunction<X['ExtShareState']>]
    useShare?: (
      shareState: ShareState & X['ExtShareState'],
      monaco: typeof MonacoEditor | null
    ) => void
    preload?: (monaco: typeof MonacoEditor) => Dispose | void
    load?: (
      editorInstance: MonacoEditor.editor.IStandaloneCodeEditor,
      monaco: typeof MonacoEditor
    ) => void | Promise<void>

    topbar?: React.ComponentType<BarItemProps<X['ExtShareState']>>[]
    statusbar?: React.ComponentType<
      BarItemProps<X['ExtShareState']>
    >[]
  }
  /**
   * 如果你返回的是一个函数，那么它将会在 Devtools 的 iframe 作用域中被调用，反之则在他的上层作用域中被使用。
   * 你可以在其中使用 `window` 来访问 Devtools 的 iframe 作用域。
   */
  devtools?: Devtools | ((window: {
    importInEvalLogs: (path: string) => Promise<{ default: Devtools }>
  }) => Promise<Devtools> | Devtools)
}

export function definePlugin<X extends {
  ExtShareState: unknown
} = {
  ExtShareState: unknown
}>(plugin: Plugin<X>) { return plugin }

export function defineDevtools(devtools: Devtools) { return devtools }
