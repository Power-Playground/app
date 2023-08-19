import { atom, getDefaultStore } from 'jotai'

import { defineDevtoolsPanel, definePlugin } from '..'

import { About } from './drawerPanels/about'

declare module '@power-playground/core' {
  interface PluginConfigures {
    about: {
      mdContent: string
    }
  }
}

const store = getDefaultStore()

export const mdContentAtom = atom('')

export default definePlugin('about', conf => {
  if (conf?.mdContent) {
    store.set(mdContentAtom, conf.mdContent)
  }
  return {
    devtools: { drawerPanels: [
      defineDevtoolsPanel('ppd.about', 'About', 'react', About)
    ] }
  }
})
