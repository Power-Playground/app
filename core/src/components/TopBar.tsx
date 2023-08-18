import './TopBar.scss'

import { useContext, useMemo } from 'react'
import { classnames } from '@power-playground/core'

import { ExtensionContext } from '../contextes/Extension'

const prefix = 'ppd-top-bar'

export function TopBar({
  className
}: {
  className?: string
}) {
  const { plugins, ...rest } = useContext(ExtensionContext)

  const topBarItems = useMemo(() => plugins
    .filter(plugin => plugin.editor?.topbar)
    .flatMap(plugin => plugin.editor?.topbar ?? []), [plugins])

  return <div className={classnames(prefix, className)}>
    {topBarItems.map((Item, i) => <Item key={i} {...rest} />)}
  </div>
}
