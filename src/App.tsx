// @replacer.use.define.__PPD_PLUGINS_GLOB_PATHS__
// noinspection ES6ConvertVarToLetConst

import './App.scss'

import './init'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { Plugin } from '@power-playground/core'
import {
  classnames,
  createQuickAccessInstance,
  EditorZone,
  elBridgeP, isConfigureUpdateWatchablePlugin, messenger, onConfigureUpdateSymbol,
  QuickAccess,
  QuickAccessContext,
  useDocumentEventListener
} from '@power-playground/core'
import commonPlugins from '@power-playground/core/common-plugins'

import { I18N } from './components/I18N'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { devRoutesMap } from './dev-routes'

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

const {
  HeaderTitle,
  headerTitleJumpLink,
  githubUrl
} = __PPD_CONFIGURES__

function Main({
  evalLogsVisible,
  onEvalLogsVisible
}: {
  evalLogsVisible: boolean
  onEvalLogsVisible: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [dockTo, setDockTo] = useState('right')
  useEffect(() => elBridgeP.on('dock-to', setDockTo), [])
  const resizable = useMemo(() => ({ [dockTo]: true } as {
    [K in 'left' | 'right' | 'bottom']?: boolean
  }), [dockTo])

  return <div className={classnames(
    'main', dockTo,
    evalLogsVisible ? 'eval-logs-visible' : ''
  )}>
    <QuickAccessContext.Provider value={createQuickAccessInstance()}>
      <QuickAccess />
      <EditorZone
        resizable={resizable}
        style={{
          '--editor-width': dockTo === 'bottom' ? '100%'
            : evalLogsVisible ? localStorage.getItem('zone-width') ?? '65%' : '100%',
          '--editor-height': dockTo !== 'bottom' ? '100%'
            : evalLogsVisible ? '50%' : '100%'
        }}
        plugins={plugins}
        onBorderBtnClick={(...[, , { type }]) => {
          if (type === 'full') {
            onEvalLogsVisible(e => !e)
            // TODO query cache
          }
        }}
      />
      {evalLogsVisible && <iframe
        src='./eval-logs.html'
        className='eval-logs'
      />}
    </QuickAccessContext.Provider>
  </div>
}

function computePathname() {
  return location
    .pathname
    .replace(import.meta.env.BASE_URL, '')
}

function usePathname() {
  const [pathname, setPathname] = useState(computePathname)
  return [
    pathname,
    useCallback<typeof setPathname>(function (pathname) {
      let newPathname = pathname
      if (typeof pathname === 'function') {
        setPathname(prev => {
          newPathname = pathname(prev)
          return newPathname
        })
      } else {
        setPathname(newPathname)
      }
      history.pushState({}, '', `${import.meta.env.BASE_URL}${newPathname}`)
    }, [])
  ] as const
}

export function App() {
  useEffect(() => onThemeChange(theme => elBridgeP.send('update:localStorage', ['uiTheme', {
    light: 'default', dark: 'dark'
  }[theme]])), [])

  const [displayHeader, setDisplayHeader] = useState(true)
  const headerTitle = useMemo(() => {
    if (!HeaderTitle) return null

    if (typeof HeaderTitle === 'string') return HeaderTitle
    return <HeaderTitle />
  }, [])
  function hideHeader() {
    if (!displayHeader) return
    // TODO query cache
    // TODO keyboard a11y support

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
  }
  useDocumentEventListener('keydown', function (e: KeyboardEvent) {
    if (e.key === 'ArrowUp' && e.shiftKey && (
      e.ctrlKey || e.metaKey
    )) {
      hideHeader()
    }
  })

  const [evalLogsVisible, setEvalLogsVisible] = useState(true)

  let content: React.ReactNode
  const [pathname, setPathname] = usePathname()
  if (pathname.startsWith('dev/')) {
    const Child = devRoutesMap.get(pathname.replace('dev/', ''))
    if (!Child) {
      content = <>404</>
    } else {
      content = <div className='components-demo'
                     data-pathname={pathname}>
        <main>
          <Suspense fallback={<>Loading...</>}>
            <Child />
          </Suspense>
        </main>
        <div className='menu'>
          {Array.from(devRoutesMap.keys()).map(key => <a
            key={key}
            className={classnames('menu-item', {
              active: pathname === `dev/${key}`
            })}
            href={`${import.meta.env.BASE_URL}dev/${key}`}
            onClick={e => {
              e.preventDefault()
              setPathname(`dev/${key}`)
            }}
          >
            {key.replace(/^[a-z]/g, s => s.toUpperCase())}
          </a>)}
        </div>
      </div>
    }
  } else {
    content = <Main evalLogsVisible={evalLogsVisible} onEvalLogsVisible={setEvalLogsVisible} />
  }
  return (
    <>
      <header style={{
        padding: displayHeader ? undefined : 0,
        maxHeight: displayHeader ? undefined : 0
      }}>
        <h1>
          {headerTitleJumpLink
            ? <a target='_blank' rel='noreferrer' href={headerTitleJumpLink}>{headerTitle}</a>
            : headerTitle}
        </h1>
        <div className='opts'>
          <a
            target='_blank'
            rel='noreferrer'
            href={githubUrl}
            className='svg-icon github'
            dangerouslySetInnerHTML={{
              __html: '<svg viewBox="0 0 24 24"><path d="m0 0h24v24h-24z" fill="#fff" opacity="0"/><path d="m16.24 22a1 1 0 0 1 -1-1v-2.6a2.15 2.15 0 0 0 -.54-1.66 1 1 0 0 1 .61-1.67c2.44-.29 4.69-1.07 4.69-5.3a4 4 0 0 0 -.67-2.22 2.75 2.75 0 0 1 -.41-2.06 3.71 3.71 0 0 0 0-1.41 7.65 7.65 0 0 0 -2.09 1.09 1 1 0 0 1 -.84.15 10.15 10.15 0 0 0 -5.52 0 1 1 0 0 1 -.84-.15 7.4 7.4 0 0 0 -2.11-1.09 3.52 3.52 0 0 0 0 1.41 2.84 2.84 0 0 1 -.43 2.08 4.07 4.07 0 0 0 -.67 2.23c0 3.89 1.88 4.93 4.7 5.29a1 1 0 0 1 .82.66 1 1 0 0 1 -.21 1 2.06 2.06 0 0 0 -.55 1.56v2.69a1 1 0 0 1 -2 0v-.57a6 6 0 0 1 -5.27-2.09 3.9 3.9 0 0 0 -1.16-.88 1 1 0 1 1 .5-1.94 4.93 4.93 0 0 1 2 1.36c1 1 2 1.88 3.9 1.52a3.89 3.89 0 0 1 .23-1.58c-2.06-.52-5-2-5-7a6 6 0 0 1 1-3.33.85.85 0 0 0 .13-.62 5.69 5.69 0 0 1 .33-3.21 1 1 0 0 1 .63-.57c.34-.1 1.56-.3 3.87 1.2a12.16 12.16 0 0 1 5.69 0c2.31-1.5 3.53-1.31 3.86-1.2a1 1 0 0 1 .63.57 5.71 5.71 0 0 1 .33 3.22.75.75 0 0 0 .11.57 6 6 0 0 1 1 3.34c0 5.07-2.92 6.54-5 7a4.28 4.28 0 0 1 .22 1.67v2.54a1 1 0 0 1 -.94 1z" fill="#231f20"/></svg>'
            }}
          />
          <div
            className='svg-icon hide-topbar'
            dangerouslySetInnerHTML={{
              __html: '<svg viewBox="100 -900 800 800"><path d="M270-223q-20 0-33.5-13.5T223-270q0-20 13.5-33.5T270-317h420q20 0 33.5 13.5T737-270q0 20-13.5 33.5T690-223H270Zm210-403L325-471q-14 14-33 13.5T259-472q-14-14-14-33.5t14-33.5l187-187q14-14 34-14t34 14l192 192q14 14 14 33t-14 33q-14 14-33.5 14T639-468L480-626Z"/></svg>'
            }}
            onClick={hideHeader}
          />
          <I18N />
          <ThemeSwitcher />
        </div>
      </header>
      {content}
    </>
  )
}
