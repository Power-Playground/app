import './TopBar.scss'

import { useContext, useMemo } from 'react'

import { ExtensionContext } from './EditorZone.tsx'

const prefix = 'ppd-top-bar'

export function TopBar() {
  const { plugins, ...rest } = useContext(ExtensionContext)

  const topBarItems = useMemo(() => plugins
    .filter(plugin => plugin.editor?.topbar)
    .flatMap(plugin => plugin.editor?.topbar ?? []), [plugins])

  console.log(topBarItems)
  return <div className={prefix}>
    {topBarItems.map((Item, i) => <Item key={i} {...rest} />)}
  </div>
}
