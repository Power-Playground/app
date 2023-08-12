import { defineDevtools, elBridgeC } from '@power-playground/core'

export default defineDevtools({
  load({ inspectorView, UI }) {
    const rightToolbar = inspectorView.tabbedPane.rightToolbar()
    rightToolbar.appendSeparator()
    const dockToolbarIcons = [
      ['largeicon-dock-to-bottom', 'Dock to bottom'],
      ['largeicon-dock-to-left', 'Dock to left'],
      ['largeicon-dock-to-right', 'Dock to right']
    ]
    const dockBtns = dockToolbarIcons.map(([icon, title]) => {
      const button = new UI.Toolbar.ToolbarToggle(title, icon)
      button.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
        dockBtns.forEach(btn => btn.setToggled(false))
        button.setToggled(!button.toggled())
        if (button.toggled()) {
          elBridgeC.send('dock-to', icon.slice('largeicon-dock-to-'.length))
        }
      })
      if (icon === 'largeicon-dock-to-right') {
        button.setToggled(true)
      }
      rightToolbar.appendToolbarItem(button)
      return button
    })
  }
})
