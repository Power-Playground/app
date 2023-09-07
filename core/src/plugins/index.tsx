import type * as UITypes from '//chii/ui/legacy/legacy.js'

import type { ReactElement } from 'react'
import React, { createContext, useContext, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import type * as MonacoEditor from 'monaco-editor'
import { equals } from 'ramda'

import type { DrawerPanel } from '../components/drawerPanelCreator'
import type { DevtoolsWindow } from '../eval-logs/extension-support'

import type { PluginConfigureIds, PluginConfigures } from './configure'
import { getPluginConfigure, onPluginConfigureUpdate } from './configure'

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
            // TODO use React.portal
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

export interface BarItemProps<S = {}> {
  searchParams: URLSearchParams
  shareState: Partial<ShareState & S>
}

export interface StandaloneKeybindingService {
  // from: https://github.com/microsoft/vscode/blob/df6d78a/src/vs/editor/standalone/browser/simpleServices.ts#L337
  // Passing undefined with `-` prefixing the commandId, will unset the existing keybinding.
  // e.g. `addDynamicKeybinding('-fooCommand', undefined, () => {})`
  // this is technically not defined in the source types, but still works. We can't pass `0`
  // because then the underlying method exits early.
  // See: https://github.com/microsoft/vscode/blob/df6d78a/src/vs/base/common/keyCodes.ts#L414
  /**
   * If your monaco editor version is up more than 0.22.3, you can use this method to add dynamic keybinding.
   */
  addDynamicKeybinding(
    commandId: string,
    keybinding: number | undefined,
    handler: MonacoEditor.editor.ICommandHandler,
    when?: string,
  ): MonacoEditor.IDisposable
  getKeybindings(): MonacoEditor.editor.IKeybindingRule[]
}
export interface IStandaloneCodeEditor extends MonacoEditor.editor.IStandaloneCodeEditor {
  _standaloneKeybindingService: StandaloneKeybindingService
}

export type Editor<X extends {
  ExtShareState: unknown
} = {
  ExtShareState: unknown
}> = {
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
    editorInstance: IStandaloneCodeEditor,
    monaco: typeof MonacoEditor
  ) => Dispose | void | Dispose[]

  topbar?: React.ComponentType<
    BarItemProps<X['ExtShareState']>
  >[]
  statusbar?: React.ComponentType<
    BarItemProps<X['ExtShareState']>
  >[]
  leftbar?: {
    id: string
    icon: string | React.ReactNode
    /** @default 'top' */
    placement?: 'top' | 'bottom'
  }[]

  drawerPanels?: DrawerPanel[]
}

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
  editor?: Editor<X>
  /**
   * 如果你返回的是一个函数，那么它将会在 Devtools 的 iframe 作用域中被调用，反之则在他的上层作用域中被使用。
   * 你可以在其中使用 `window` 来访问 Devtools 的 iframe 作用域。
   */
  devtools?: Devtools | ((window: {
    importInEvalLogs: (path: string) => Promise<{ default: Devtools }>
  }) => Promise<Devtools> | Devtools)
}

export * from './configure'

const idAndConfigureToPluginCache = [] as (
  [string, unknown, () => Plugin, Plugin]
)[]

function cachePlugin(
  id: string,
  configure: unknown,
  pluginInit: () => Plugin,
  plugin?: Plugin | undefined
): Plugin | undefined {
  if (!plugin)
    return idAndConfigureToPluginCache
      .find(([id_, configure_]) => id_ === id && configure_ === configure)
      ?.[3]

  idAndConfigureToPluginCache.push([id, configure, pluginInit, plugin])
}

function isExistPlugin(id: string, configure: unknown, pluginInit: () => Plugin) {
  return idAndConfigureToPluginCache.some(([id_, configure_, pluginInit_]) => {
    return id_ === id && configure_ === configure && pluginInit_ === pluginInit
  })
}

export function clearPluginCache() {
  idAndConfigureToPluginCache.splice(0)
}

export const onConfigureUpdateSymbol = Symbol('configure-update')

export interface ConfigureUpdateWatchablePlugin<
  X extends { ExtShareState: unknown } = { ExtShareState: unknown }
> {
  [onConfigureUpdateSymbol]: (lis: (newPlugin: Plugin<X> & ConfigureUpdateWatchablePlugin<X>) => void) => Dispose
}

export function isConfigureUpdateWatchablePlugin(
  plugin: unknown
): plugin is ConfigureUpdateWatchablePlugin {
  return typeof plugin === 'object' && plugin !== null && onConfigureUpdateSymbol in plugin
}

export function definePlugin<
  X extends { ExtShareState: unknown } = { ExtShareState: unknown }
>(plugin: Plugin<X>): Plugin<X>
export function definePlugin<
  ID extends PluginConfigureIds,
  X extends { ExtShareState: unknown } = { ExtShareState: unknown }
>(
  id: ID,
  pluginInit: (conf?: PluginConfigures[ID]) => Plugin<X>
): Plugin<X>
export function definePlugin<
  ID extends PluginConfigureIds,
  X extends { ExtShareState: unknown } = { ExtShareState: unknown }
>(
  a: ID | Plugin<X>,
  pluginInit?: (conf?: PluginConfigures[ID]) => Plugin<X>
) {
  let lis: ((newPlugin: Plugin<X> & ConfigureUpdateWatchablePlugin<X>) => void) | undefined
  let usedConfig: PluginConfigures[ID] | undefined
  function generatePlugin(id: string, config: PluginConfigures[ID]) {
    if (!pluginInit) throw new Error('The second argument is required')

    const plugin = pluginInit?.(config) as Plugin<X> & ConfigureUpdateWatchablePlugin
    usedConfig = config
    plugin[onConfigureUpdateSymbol] = lis_ => {
      lis = lis_
      return () => lis = undefined
    }
    cachePlugin(id, config, pluginInit, plugin)
    return plugin
  }

  if (typeof a === 'string') {
    if (!pluginInit)
      throw new Error('The second argument is required')

    const id = a
    const config = getPluginConfigure(id)
    if (isExistPlugin(id, config, pluginInit))
      return cachePlugin(id, config, pluginInit)

    // TODO export off function, and run it when plugin is unmounted
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const off = onPluginConfigureUpdate(id, newConfig => {
      // 懒得写英语了
      // 当 hmr 或者后面要做的插件配置编辑导致配置更新时，对配置文件进行深度比较，如果相同则不更新
      // 防止字面量未变，引用改变导致的全量更新
      if (equals(usedConfig, newConfig)) return

      lis?.(generatePlugin(id, newConfig))
    })

    return generatePlugin(id, config)
  }

  return a
}

export function defineDevtools(devtools: Devtools) { return devtools }
