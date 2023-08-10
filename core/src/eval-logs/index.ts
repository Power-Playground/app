import sentinel from 'sentinel-js'

import { elBridgeC } from './bridge.ts'
import { Files } from './files.ts'

sentinel.on('.__chobitsu-hide__', _el => {
  const el = /** @type {HTMLDivElement} */ (_el)
  el.children[0]?.remove()
})

// @ts-ignore
window.require = function (name) {
  // switch (name) {
  // }
  throw new Error(`Cannot find module '${name}'`)
}

let prevDisposeFunc: Function

function addDisposeFunc(func?: Function) {
  const oldDisposeFunc = prevDisposeFunc
  prevDisposeFunc = () => {
    oldDisposeFunc?.()
    func?.()
  }
}

elBridgeC.on('run', () => {
  Files.forEach(({ name, text: code }) => {
    if (name !== '/index.js') return

    // TODO support fileSystem
    try {
      prevDisposeFunc?.()
      addDisposeFunc(eval(
        `(function () { const module = { exports: {} }; const exports = module.exports; ${code}; return module.exports; })()`
      ).dispose)
    } catch (e) {
      console.error(e)
    }
  })
})
elBridgeC.on('update:localStorage', ([key, value]) => {
  const current = JSON.parse(localStorage.getItem(key) ?? '""')
  if (current !== value) {
    localStorage.setItem(key, JSON.stringify(value))
  }
})
