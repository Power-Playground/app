import * as Awaitabler from 'awaitabler'
import * as AwaitablerString from 'awaitabler/prototypes/string.reg'
import * as AwaitablerNumber from 'awaitabler/prototypes/number.reg'

import { elBridgeC } from './bridge.ts'
import { Files } from './files.ts'

// @ts-ignore
window.require = function (name) {
  switch (name) {
    case 'awaitabler': return Awaitabler
    case 'awaitabler/prototypes/number': {
      addDisposeFunc(AwaitablerNumber.default())
      return
    }
    case 'awaitabler/prototypes/number.reg': return AwaitablerNumber
    case 'awaitabler/prototypes/string': {
      addDisposeFunc(AwaitablerString.default())
      return
    }
    case 'awaitabler/prototypes/string.reg': return AwaitablerString
  }
  throw new Error(`Cannot find module '${name}'`)
}

let prevDisposeFunc: Function

function addDisposeFunc(func?: Function) {
  let oldDisposeFunc = prevDisposeFunc
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
