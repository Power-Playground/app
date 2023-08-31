import { definePlugin } from '@power-playground/core'

const hackStyle = `
.tabbed-pane-header {
  flex: 0 0 33px;
}
.tabbed-pane-header > .tabbed-pane-left-toolbar.toolbar {
  display: none !important;
}
.tabbed-pane-header .tabbed-pane-header-tab {
  height: 32px;
}
.tabbed-pane-right-toolbar {
  display: flex;
  align-items: center;
}
`.trim()

export default definePlugin({
  devtools: {
    beforeMount({ devtoolsWindow }) {
      const { document } = devtoolsWindow
      const style = document.createElement('style')
      style.innerText = hackStyle
      let tabbedPane: Element | null
      // TODO refactor by sentinel, now it's a hack
      //      unable load right document when use sentinel
      //      so I think sentinel which need to fork
      !async function() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          tabbedPane = document.querySelector('.main-tabbed-pane')
          if (!tabbedPane) {
            await new Promise(resolve => setTimeout(resolve, 100))
            continue
          }
          tabbedPane.shadowRoot?.appendChild(style)
          break
        }
      }()
      return () => {
        tabbedPane?.shadowRoot?.removeChild(style)
      }
    },
    load({ inspectorView: { tabbedPane } }) {
      tabbedPane.leftToolbar().removeToolbarItems()
    }
  }
})
