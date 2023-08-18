// @replacer.use.define.__PPD_PLUGINS_GLOB_PATHS__
// noinspection ES6ConvertVarToLetConst

import './App.scss'

import './init'

import { useEffect, useMemo, useState } from 'react'
import type { Plugin } from '@power-playground/core'
import {
  createQuickAccessInstance,
  EditorZone,
  elBridgeP, isConfigureUpdateWatchablePlugin, messenger, onConfigureUpdateSymbol,
  QuickAccess,
  QuickAccessContext
} from '@power-playground/core'
import commonPlugins from '@power-playground/core/common-plugins'

import PP from '../resources/PP_P.svg'

import { I18N } from './components/I18N'
import { ThemeSwitcher } from './components/ThemeSwitcher'

const plugins = Object.assign(
  {},
  commonPlugins,
  import.meta
    .glob(__PPD_PLUGINS_GLOB_PATHS__, { eager: true, import: 'default' })
) as Record<string, Plugin>

declare global {
  // eslint-disable-next-line no-var
  var __PPD_PLUGINS__: Record<string, Plugin> | null
  // eslint-disable-next-line no-var
  var __OLD_PPD_PLUGINS__: Record<string, Plugin> | null
}

Object.entries(plugins)
  .forEach(([id, plugin]) => {
    if (isConfigureUpdateWatchablePlugin(plugin)) {
      console.debug(`plugin ${id} is watchable`)
      const dispose = plugin[onConfigureUpdateSymbol](function onConfigureUpdate(newPlugin) {
        console.debug(`plugin ${id} updated`)
        plugins[id] = newPlugin
        newPlugin[onConfigureUpdateSymbol](onConfigureUpdate)

        elBridgeP.send('hmr:plugins-update')
        dispose()
      })
    }
  })
if (import.meta.hot) {
  window.__OLD_PPD_PLUGINS__ = window.__PPD_PLUGINS__
  window.__PPD_PLUGINS__ = plugins
  import.meta.hot.accept(() => {
    console.debug('plugins updated')
    elBridgeP.send('hmr:plugins-update')
  })
} else {
  window.__PPD_PLUGINS__ = plugins
}

export function App() {
  useEffect(() => onThemeChange(theme => elBridgeP.send('update:localStorage', ['uiTheme', {
    light: 'default', dark: 'dark'
  }[theme]])), [])

  const [dockTo, setDockTo] = useState('right')
  useEffect(() => elBridgeP.on('dock-to', setDockTo), [])
  const resizable = useMemo(() => ({ [dockTo]: true } as {
    [K in 'left' | 'right' | 'bottom']?: boolean
  }), [dockTo])

  const [displayHeader, setDisplayHeader] = useState(true)
  return (
    <>
      <header style={{ display: displayHeader ? 'flex' : 'none' }}>
        <h1>
          <a href='https://github.com/power-playground/app'
             target='_blank'
             style={{
               color: '#fff',
               textDecoration: 'none'
             }}
             rel='noreferrer'
          >
            <img src={PP} width='24px' alt='Power Playground Icon' />
            &nbsp;
            Power Playground
          </a>
        </h1>
        <div className='opts'>
          <div
            className='hide-topbar'
            dangerouslySetInnerHTML={{
              __html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 -960 960 960"><path fill="var(--icon-cr)" d="M450-160v-371L330-411l-43-43 193-193 193 193-43 43-120-120v371h-60ZM160-597v-143q0-24 18-42t42-18h520q24 0 42 18t18 42v143h-60v-143H220v143h-60Z"/></svg>'
            }}
            onClick={() => {
              setDisplayHeader(false)
              messenger.then(m => m.display(
                'info', <>Press <kbd>Esc</kbd> to show the header again</>, {
                  position: 'top-center'
                }
              ))
              document.addEventListener('keydown', function onEsc(e: KeyboardEvent) {
                if (e.key === 'Escape') {
                  setDisplayHeader(true)
                  document.removeEventListener('keydown', onEsc)
                }
              })
            }}
          />
          <I18N />
          <ThemeSwitcher />
        </div>
      </header>
      <div className={`main ${dockTo}`}>
        <QuickAccessContext.Provider value={createQuickAccessInstance()}>
          <QuickAccess />
          <EditorZone
            resizable={resizable}
            style={{
              '--editor-width': dockTo === 'bottom' ? '100%' : '50%',
              '--editor-height': dockTo === 'bottom' ? '50%' : '100%'
            }}
            plugins={plugins}
          />
          <iframe
            src='./eval-logs.html'
            className='eval-logs'
          />
        </QuickAccessContext.Provider>
      </div>
    </>
  )
}
