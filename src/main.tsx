import './main.scss'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App.tsx'

window.__DEBUG__ = JSON.parse(localStorage.getItem('enableDebug') ?? 'false')
Object.defineProperty(window, '牛逼', {
  get() {
    if (__DEBUG__) {
      __DEBUG__ = false
      localStorage.setItem('enableDebug', 'false')
    } else {
      __DEBUG__ = true
      localStorage.setItem('enableDebug', 'true')
    }
    // debug 模式启动
    console.log(`debug 模式${__DEBUG__ ? '启动' : '关闭'}`)
    setTimeout(location.reload.bind(location), 500)
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
