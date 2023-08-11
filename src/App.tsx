import './App.scss'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import 'react-toastify/dist/ReactToastify.css'

import { useEffect, useMemo, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import type { definePlugin } from '@power-playground/core'
import {
  createQuickAccessInstance,
  EditorZone,
  elBridgeP,
  QuickAccess,
  QuickAccessContext
} from '@power-playground/core'

import { I18N } from './components/I18N.tsx'
import { ThemeSwitcher } from './components/ThemeSwitcher.tsx'

const plugins = import.meta
  .glob([
    './plugins/*.ts*',
    './plugins/*/index.ts*'
  ], {
    import: 'default'
  }) as Record<string, () => Promise<ReturnType<typeof definePlugin>>>

// @ts-ignore
window.PPD_PLUGINS = plugins

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
      <ToastContainer />
      <header style={{ display: displayHeader ? 'flex' : 'none' }}>
        <h1>
          <a href='https://github.com/power-playground/app'
             target='_blank'
             style={{
               color: '#fff',
               textDecoration: 'none'
             }}
             rel='noreferrer'
          >Power Playground</a>
        </h1>
        <div className='opts'>
          <div
            className='hide-topbar'
            dangerouslySetInnerHTML={{
              __html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 -960 960 960"><path fill="var(--fr-cr)" d="M450-160v-371L330-411l-43-43 193-193 193 193-43 43-120-120v371h-60ZM160-597v-143q0-24 18-42t42-18h520q24 0 42 18t18 42v143h-60v-143H220v143h-60Z"/></svg>'
            }}
            onClick={() => {
              setDisplayHeader(false)
              toast(<>Press <kbd>Esc</kbd> to show the header again</>, {
                type: 'info',
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
              })
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
          />
          <iframe
            src='./eval-logs.html'
            frameBorder={0}
            className='eval-logs'
          />
        </QuickAccessContext.Provider>
      </div>
    </>
  )
}
