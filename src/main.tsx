// noinspection JSNonASCIINames

import './main.scss'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App.tsx'

window.__DEBUG__ = JSON.parse(localStorage.getItem('enableDebug') ?? 'false')
Object.defineProperty(window, '小黑子', {
  get() {
    if (__DEBUG__) {
      __DEBUG__ = false
      localStorage.setItem('enableDebug', 'false')
    } else {
      __DEBUG__ = true
      localStorage.setItem('enableDebug', 'true')
    }
    // debug 模式启动
    console.log(`小黑子模式${__DEBUG__ ? '启动' : '关闭'}`)
    const decoded = unescape(encodeURIComponent(import.meta.glob('../PP_小黑子.svg', {
      eager: true,
      as: 'raw'
    })['../PP_小黑子.svg']))
    const base64 = btoa(decoded)
    const imgSource = `data:image/svg+xml;base64,${base64}`

    console.log("%c ", `
      font-size: 128px;
      background: url("${imgSource}") no-repeat center;
    `)
    setTimeout(location.reload.bind(location), 500)
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
