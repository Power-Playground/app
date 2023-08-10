import { definePlugin } from '@power-playground/core'

export default definePlugin({
  devtools: {
    async beforeMount({ devtoolsWindow }) {
      const { document } = devtoolsWindow
      const style = document.createElement('style')
      style.innerText = `.tabbed-pane-header > .tabbed-pane-left-toolbar.toolbar { display: none !important; }`
      // TODO refactor by sentinel, now it's a hack
      //      unable load right document when use sentinel
      //      so I think sentinel which need to fork
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const tabbedPane = document.querySelector('.main-tabbed-pane')
        if (!tabbedPane) {
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        }
        tabbedPane.shadowRoot?.appendChild(style)
        break
      }
    },
    load({ inspectorView: { tabbedPane } }) {
      tabbedPane.leftToolbar().removeToolbarItems()
    }
  }
})
