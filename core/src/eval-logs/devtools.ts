import type * as UI from '//chii/ui/legacy/legacy'

import sentinel from 'sentinel-js'

import type { definePlugin } from '../plugins'

import { elBridgeC } from './bridge.ts'

console.log('devtools')

const storageInited = localStorage.getItem('storageInited')
if (!storageInited) {
  localStorage.setItem('storageInited', JSON.stringify(true))

  localStorage.setItem('textEditorIndent', JSON.stringify('  '))
}
localStorage.setItem('consoleShowSettingsToolbar', JSON.stringify(false))
localStorage.setItem(
  'viewsLocationOverride',
  JSON.stringify({ resources: 'none', elements: 'none', network: 'none', sources: 'none' })
)
localStorage.setItem('panel-selectedTab', JSON.stringify('console'))

type ImportMap = {
  'ui/legacy/legacy.js': typeof import('//chii/ui/legacy/legacy')
  'core/common/common.js': typeof import('//chii/core/common/common')
  'ui/legacy/theme_support/theme_support.js': typeof import('//chii/ui/legacy/theme_support/theme_support')
}

export type DevtoolsWindow = Window & typeof globalThis & {
  simport: <R = never, const T extends keyof ImportMap | (string & {}) = string>(path: T) => Promise<
    [R] extends [never]
      ? T extends keyof ImportMap ? ImportMap[T] : unknown
      : R
  >
}

console.log(__DEBUG__)
sentinel.on('iframe', (devtools: HTMLIFrameElement) => {
  const devtoolsWindow: DevtoolsWindow = devtools.contentWindow! as DevtoolsWindow
  const devtoolsDocument = devtools.contentDocument!
  __DEBUG__ && console.debug('devtools', devtoolsWindow, devtoolsDocument)
  __DEBUG__ && console.debug('readyState', devtoolsDocument.readyState)

  devtoolsWindow.eval(`window.simport = path => import(\`https://cdn.jsdelivr.net/npm/chii/public/front_end/\${path}\`)`)

  const plugins = import.meta
    .glob('../plugins/*/index.ts*', {
      import: 'default'
    }) as Record<string, () => Promise<ReturnType<typeof definePlugin>>>
  // @ts-ignore
  const PPD_PLUGINS: typeof plugins = window.parent.PPD_PLUGINS ?? {}

  const ALL_PLUGINS = { ...plugins, ...PPD_PLUGINS }

  // eslint-disable-next-line no-unused-labels
  beforeMount: {
    Object.entries(ALL_PLUGINS)
      .forEach(async ([, plugin]) => {
        const { devtools } = await plugin()
        devtools?.beforeMount?.({ devtoolsWindow })
      })
  }

  // eslint-disable-next-line no-unused-labels
  resolveElBridgeC: {
    let uiTheme = JSON.parse(localStorage.getItem('uiTheme') ?? '""')
    elBridgeC.on('update:localStorage', ([key, value]) => {
      if (key === 'uiTheme' && uiTheme !== value) {
        // TODO Setting page select value is wrong
        const html = devtoolsDocument.querySelector('html')!
        if (value === 'dark') {
          html.classList.add('-theme-with-dark-background')
        }
        if (value === 'default') {
          html.classList.remove('-theme-with-dark-background')
        }
        uiTheme = value
      }
    })
  }

  function registerPlugins(realUI: typeof UI, inspectorView: UI.InspectorView.InspectorView) {
    const { tabbedPane, ...inspector } = inspectorView
    const drawerTabbedPane: UI.TabbedPane.TabbedPane =
      // @ts-ignore
      inspector.drawerTabbedPane
    Object.entries(ALL_PLUGINS)
      .forEach(async ([, plugin]) => {
        const { devtools } = await plugin()
        devtools?.panels?.forEach(panel => {
          const Widget = panel(devtoolsWindow, realUI)
          const widget = new Widget()
          if (!tabbedPane.hasTab(panel.id)) {
            tabbedPane?.appendTab(panel.id, panel.title, widget)
          }
        })
        devtools?.drawerPanels?.forEach(panel => {
          const Widget = panel(devtoolsWindow, realUI)
          const widget = new Widget()

          if (!drawerTabbedPane.hasTab(panel.id)) {
            drawerTabbedPane?.appendTab(panel.id, panel.title, widget)
          }
        })
        devtools?.load?.({
          devtoolsWindow, UI: realUI, inspectorView
        })
      })
  }

  let runIsCalled = false

  const runnable = () => ({
    run: async () => {
      if (runIsCalled) return
      runIsCalled = true

      const realUI = await devtoolsWindow.simport('ui/legacy/legacy.js')
      const inspectorView = realUI.InspectorView.InspectorView.instance()

      const rightToolbar = inspectorView.tabbedPane.rightToolbar()
      rightToolbar.appendSeparator()
      const dockToolbarIcons = [
        ['largeicon-dock-to-bottom', 'Dock to bottom'],
        ['largeicon-dock-to-left', 'Dock to left'],
        ['largeicon-dock-to-right', 'Dock to right']
      ]
      const dockBtns = dockToolbarIcons.map(([icon, title]) => {
        const button = new realUI.Toolbar.ToolbarToggle(title, icon)
        button.addEventListener(realUI.Toolbar.ToolbarButton.Events.Click, () => {
          dockBtns.forEach(btn => btn.setToggled(false))
          button.setToggled(!button.toggled())
          if (button.toggled()) {
            elBridgeC.send('dock-to', icon.slice('largeicon-dock-to-'.length))
          }
        })
        if (icon === 'largeicon-dock-to-right') {
          button.setToggled(true)
        }
        rightToolbar.appendToolbarItem(button)
        return button
      })

      registerPlugins(realUI, inspectorView)
    }
  })

  async function main() {
    const realCommon = await devtoolsWindow.simport('core/common/common.js')
    realCommon.Runnable.registerEarlyInitializationRunnable(runnable)

    const { MainImpl } = await devtoolsWindow
      .simport<typeof import('//chii/entrypoints/main/main')>(
        'entrypoints/main/main.js'
      )
    let initializeTargetResolver: () => void
    const initializeTargetPromise = new Promise<void>(re => initializeTargetResolver = re)
    const _timeend = MainImpl.MainImpl.timeEnd
    MainImpl.MainImpl.timeEnd = function (label: string) {
      _timeend.call(MainImpl.MainImpl, label)
      if ([
        'Main._initializeTarget',
        'Main._lateInitialization'
      ].includes(label)) {
        initializeTargetResolver()
      }
    }
    const instance = MainImpl.MainImpl.instanceForTest
    if (instance === null) return

    const lateInitDonePromise = (instance as any).lateInitDonePromise as Promise<void>
    if (lateInitDonePromise === undefined) {
      await initializeTargetPromise
    } else {
      await lateInitDonePromise
    }
    try {
      await runnable().run()
    } catch (e) {
      runIsCalled = false
      console.debug(e)
    }
  }

  main()
})
