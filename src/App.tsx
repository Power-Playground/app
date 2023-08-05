import './App.scss'

import { useEffect } from 'react'
import { EditorZone, elBridgeP } from '@power-playground/core'

import { ThemeSwitcher } from './components/ThemeSwitcher.tsx'

export function App() {
  useEffect(() => onThemeChange(theme => elBridgeP.send('update:localStorage', ['uiTheme', {
    light: 'default', dark: 'dark'
  }[theme]])), [])
  return (
    <>
      <header>
        <h1 style={{ margin: 0 }}>
          <a href='https://github.com/power-playground/app'
             target='_blank'
             style={{
              color: '#fff',
              textDecoration: 'none'
            }}
          >
            Power Playground
          </a>
        </h1>
        <ThemeSwitcher />
      </header>
      <div className='main'>
        <EditorZone />
        <iframe src='./eval-logs.html' frameBorder={0} className='eval-logs' />
      </div>
    </>
  )
}
