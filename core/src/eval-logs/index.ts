import sentinel from 'sentinel-js'

import { elBridgeC } from './bridge.ts'

window.__DEBUG__ = JSON.parse(localStorage.getItem('enableDebug') ?? 'false')

sentinel.on('.__chobitsu-hide__', _el => {
  const el = /** @type {HTMLDivElement} */ (_el)
  el.children[0]?.remove()
})
elBridgeC.on('update:localStorage', ([key, value]) => {
  const current = JSON.parse(localStorage.getItem(key) ?? '""')
  if (current !== value) {
    localStorage.setItem(key, JSON.stringify(value))
  }
})
