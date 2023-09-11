import './ThemeSwitcher.scss'

import { useState } from 'react'
import { classnames } from '@power-playground/core'

declare const theme: 'light' | 'dark' | (string & {})

const THEME_STORE_KEY = 'theme'
let curThemeMode: typeof theme | null = null
const themeChangeListeners: Function[] = []

window.onThemeChange = function (listener) {
  themeChangeListeners.push(listener)
  curThemeMode && listener(curThemeMode, curThemeMode === 'auto')
}

function updateTheme(mode?: typeof theme) {
  const theme = localStorage.getItem(THEME_STORE_KEY) ?? 'auto'
  if (theme !== 'auto') {
    mode = theme
  } else {
    if (mode === undefined) {
      const mediaQueryListDark = window.matchMedia('(prefers-color-scheme: dark)')
      mode = mediaQueryListDark.matches ? 'dark' : ''
    }
  }
  curThemeMode = mode || 'light'
  themeChangeListeners.forEach(listener => listener(curThemeMode, theme === 'auto'))
  if (mode === 'dark') {
    document.documentElement.setAttribute('theme-mode', 'dark')
  } else {
    document.documentElement.removeAttribute('theme-mode')
  }
}

updateTheme()

window
  .matchMedia('(prefers-color-scheme: dark)')
  .addListener((mediaQueryListEvent) => {
    updateTheme(mediaQueryListEvent.matches ? 'dark' : '')
  })

export function ThemeSwitcher() {
  const [t, setT] = useState<typeof theme>(localStorage.getItem(THEME_STORE_KEY) ?? 'auto')
  return <div className='theme-switch' data-mode={t}>
    <div className={classnames('light', { active: t === 'light' })}
         onClick={() => {
           setT('light')
           localStorage.setItem(THEME_STORE_KEY, 'light')
           updateTheme()
         }} />
    <div className={classnames('dark', { active: t === 'dark' })}
         onClick={() => {
           setT('dark')
           localStorage.setItem(THEME_STORE_KEY, 'dark')
           updateTheme()
         }} />
    <div className={classnames('auto', { active: t === 'auto' })}
         title='auto detect by system'
         onClick={() => {
           setT('auto')
           localStorage.setItem(THEME_STORE_KEY, 'auto')
           updateTheme()
         }} />
  </div>
}
