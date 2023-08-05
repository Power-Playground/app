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

let inited = false
async function checkInspectorViewIsLoaded() {
  const realThemeSupport = await devtoolsWindow.simport('ui/legacy/theme_support/theme_support.js')
  if (!realThemeSupport.ThemeSupport.hasInstance())
    return

  const realUI = await devtoolsWindow.simport('ui/legacy/legacy.js')
  const inspectorView = realUI.InspectorView.InspectorView.instance()
  if (inspectorView && !inited) {
    inited = true
    await init()
  }
}
(async () => {
  if (devtoolsDocument.readyState === 'complete') {
    await checkInspectorViewIsLoaded()
  } else {
    devtoolsDocument.addEventListener('load', checkInspectorViewIsLoaded, true)
  }
})()

const plugins = import.meta.glob('../../plugins/*/index.ts*', {
  import: 'default'
}) as Record<string, () => Promise<ReturnType<typeof definePlugins>>>
function registerPlugins(realUI: typeof UI, tabbedPane: UI.TabbedPane.TabbedPane) {
  Object.entries(plugins)
    .forEach(async ([path, plugin]) => {
      const { devtools } = await plugin()
      devtools?.panels?.forEach(panel => {
        const Widget = panel(devtoolsWindow, realUI)
        if (tabbedPane.hasTab(panel.id)) {
          return
        }
        tabbedPane?.appendTab(panel.id, panel.title, new Widget())
      })
    })
}

async function init() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const realUI = await devtoolsWindow.simport('ui/legacy/legacy.js')
      const inspectorView = realUI.InspectorView.InspectorView.instance()
      const tabbedPane = inspectorView?.tabbedPane
      registerPlugins(realUI, tabbedPane)
      break
    } catch (e) {
      console.error(e)
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }

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
