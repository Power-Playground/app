import './index.scss'

import React, { useContext, useMemo } from 'react'

import { ExtensionContext } from '../../contextes/Extension'

import { GoToLC } from './GoToLC'
import { History } from './History'

const prefix = 'ppd-bottom-status'

export function BottomStatus() {
  const { plugins, ...rest } = useContext(ExtensionContext)
  const statusBarItems = useMemo(() => plugins
    .filter(plugin => plugin.editor?.statusbar)
    .flatMap(plugin => plugin.editor?.statusbar ?? []), [plugins])

  console.log(statusBarItems)
  return <div className={`monaco-editor ${prefix}`}>
    {statusBarItems.map((Item, i) => <Item key={i} {...rest} />)}
    <History />
    <GoToLC />
  </div>
}
