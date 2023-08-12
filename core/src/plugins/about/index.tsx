import { defineDevtoolsPanel, definePlugin } from '../index'

import { About } from './drawerPanels/about'

export default definePlugin({
  devtools: { drawerPanels: [
    defineDevtoolsPanel('ppd.about', 'About', 'react', About)
  ] }
})
