import { defineDevtools, elBridgeC } from '@power-playground/core'

import { Files } from '../../eval-logs/files'

import { JSPanel } from './panels/javascript'
import { DTSPanel } from './panels/typescript'

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

export default defineDevtools({
  panels: [JSPanel, DTSPanel]
})
