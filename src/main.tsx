import './main.scss'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App.tsx'

Object.defineProperty(window, '牛逼', {
  get() {
    let flag = JSON.parse(localStorage.getItem('enableDebug') ?? 'false')
    if (flag) {
      flag = false
      localStorage.setItem('enableDebug', 'false')
    } else {
      flag = true
      localStorage.setItem('enableDebug', 'true')
    }
    // debug 模式启动
    console.log(`debug 模式${flag ? '关闭' : '启动'}`)
    window.__DEBUG__ = flag
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
