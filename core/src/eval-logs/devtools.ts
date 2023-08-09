import type * as UI from '//chii/ui/legacy/legacy'

import type { definePlugins } from '../plugins'

import { elBridgeC } from './bridge.ts'

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

export type DevtoolsWindow = Window & {
  simport: <R = never, const T extends keyof ImportMap | (string & {}) = string>(path: T) => Promise<
    [R] extends [never]
      ? T extends keyof ImportMap ? ImportMap[T] : unknown
      : R
  >
}

const devtools = document.querySelector('iframe')!
const devtoolsWindow: DevtoolsWindow = devtools.contentWindow! as DevtoolsWindow
const devtoolsDocument = devtools.contentDocument!

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

const plugins = import.meta.glob('../plugins/*/index.ts*', {
  import: 'default'
}) as Record<string, () => Promise<ReturnType<typeof definePlugins>>>

function registerPlugins(realUI: typeof UI, {
  tabbedPane,
  ...inspector
}: {
  tabbedPane: UI.TabbedPane.TabbedPane
}) {
  const drawerTabbedPane: UI.TabbedPane.TabbedPane =
    // @ts-ignore
    inspector.drawerTabbedPane
  // const drawerLeftToolbar = drawerTabbedPane.leftToolbar()
  Object.entries(plugins)
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
    })
}

let runIsCalled = false

const runnable = () => ({
  run: async () => {
    if (runIsCalled) return
    runIsCalled = true

    const realUI = await devtoolsWindow.simport('ui/legacy/legacy.js')
    const inspectorView = realUI.InspectorView.InspectorView.instance()

    const leftToolbar = inspectorView.tabbedPane.leftToolbar()
    leftToolbar.removeToolbarItems()
    registerPlugins(realUI, inspectorView)
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
  }
})

const realCommon = await devtoolsWindow.simport('core/common/common.js')
realCommon.Runnable.registerEarlyInitializationRunnable(runnable)

main: {
  const { MainImpl } = await devtoolsWindow.simport<
    typeof import('//chii/entrypoints/main/main')
  >('entrypoints/main/main.js')
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
  if (instance === null) break main

  const lateInitDonePromise = instance.lateInitDonePromise as Promise<void>
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
