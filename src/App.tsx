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
             rel='noreferrer'
          >
            <img src={PP} width='24px' alt='Power Playground Icon' />
            &nbsp;
            <span style={{
              color: 'color-mix(in srgb, var(--primary), #fff 80%)',
              fontWeight: 'bolder'
            }}>P</span>ower
            &nbsp;
            <span style={{
              color: 'color-mix(in srgb, var(--primary), #fff 80%)',
              fontWeight: 'bolder'
            }}>P</span>layground
          </a>
        </h1>
        <div className='opts'>
          <div
            className='svg-icon github'
            dangerouslySetInnerHTML={{
              __html:
                '<svg viewBox="0 0 128 128" width="28" height="28">\n' +
                  '<g fill="#181616"><path fill-rule="evenodd" clip-rule="evenodd" d="M64 5.103c-33.347 0-60.388 27.035-60.388 60.388 0 26.682 17.303 49.317 41.297 57.303 3.017.56 4.125-1.31 4.125-2.905 0-1.44-.056-6.197-.082-11.243-16.8 3.653-20.345-7.125-20.345-7.125-2.747-6.98-6.705-8.836-6.705-8.836-5.48-3.748.413-3.67.413-3.67 6.063.425 9.257 6.223 9.257 6.223 5.386 9.23 14.127 6.562 17.573 5.02.542-3.903 2.107-6.568 3.834-8.076-13.413-1.525-27.514-6.704-27.514-29.843 0-6.593 2.36-11.98 6.223-16.21-.628-1.52-2.695-7.662.584-15.98 0 0 5.07-1.623 16.61 6.19C53.7 35 58.867 34.327 64 34.304c5.13.023 10.3.694 15.127 2.033 11.526-7.813 16.59-6.19 16.59-6.19 3.287 8.317 1.22 14.46.593 15.98 3.872 4.23 6.215 9.617 6.215 16.21 0 23.194-14.127 28.3-27.574 29.796 2.167 1.874 4.097 5.55 4.097 11.183 0 8.08-.07 14.583-.07 16.572 0 1.607 1.088 3.49 4.148 2.897 23.98-7.994 41.263-30.622 41.263-57.294C124.388 32.14 97.35 5.104 64 5.104z"></path><path d="M26.484 91.806c-.133.3-.605.39-1.035.185-.44-.196-.685-.605-.543-.906.13-.31.603-.395 1.04-.188.44.197.69.61.537.91zm2.446 2.729c-.287.267-.85.143-1.232-.28-.396-.42-.47-.983-.177-1.254.298-.266.844-.14 1.24.28.394.426.472.984.17 1.255zM31.312 98.012c-.37.258-.976.017-1.35-.52-.37-.538-.37-1.183.01-1.44.373-.258.97-.025 1.35.507.368.545.368 1.19-.01 1.452zm3.261 3.361c-.33.365-1.036.267-1.552-.23-.527-.487-.674-1.18-.343-1.544.336-.366 1.045-.264 1.564.23.527.486.686 1.18.333 1.543zm4.5 1.951c-.147.473-.825.688-1.51.486-.683-.207-1.13-.76-.99-1.238.14-.477.823-.7 1.512-.485.683.206 1.13.756.988 1.237zm4.943.361c.017.498-.563.91-1.28.92-.723.017-1.308-.387-1.315-.877 0-.503.568-.91 1.29-.924.717-.013 1.306.387 1.306.88zm4.598-.782c.086.485-.413.984-1.126 1.117-.7.13-1.35-.172-1.44-.653-.086-.498.422-.997 1.122-1.126.714-.123 1.354.17 1.444.663zm0 0"></path></g>\n' +
                '</svg>'
            }}
          />
          <div
            className='svg-icon hide-topbar'
            dangerouslySetInnerHTML={{
              __html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 -960 960 960"><path d="M450-160v-371L330-411l-43-43 193-193 193 193-43 43-120-120v371h-60ZM160-597v-143q0-24 18-42t42-18h520q24 0 42 18t18 42v143h-60v-143H220v143h-60Z"/></svg>'
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
