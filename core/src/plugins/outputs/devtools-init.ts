import { elBridgeC } from '@power-playground/core'

import { Files } from './files.ts'

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

console.log(1111)

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
