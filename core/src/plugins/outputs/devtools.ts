import './devtools-init'

import { defineDevtools, defineDevtoolsPanel } from '@power-playground/core'

import { JSPanel } from './panels/javascript'
import { DTSPanel } from './panels/typescript'

// TODO More Panel
//   Errors
//   AST
export default defineDevtools({
  panels: [
    defineDevtoolsPanel('outputs.js', '.JS', 'react', JSPanel),
    defineDevtoolsPanel('outputs.d.ts', '.D.TS', 'react', DTSPanel)
  ]
})
