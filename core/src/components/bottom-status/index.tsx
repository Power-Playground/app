import './index.scss'

import React, { useContext, useMemo } from 'react'

import { ExtensionContext } from '../../contextes/Extension'

import { GoToLC } from './GoToLC.tsx'
import { Help } from './Help.tsx'
import { History } from './History.tsx'

const prefix = 'ppd-bottom-status'

export function BottomStatus() {
  const { plugins, ...rest } = useContext(ExtensionContext)
  const statusBarItems = useMemo(() => plugins
    .filter(plugin => plugin.editor?.statusbar)
    .flatMap(plugin => plugin.editor?.statusbar ?? []), [plugins])

  return <div className={`monaco-editor ${prefix}`}>
    <Help />
    <History />
    <GoToLC />
    {statusBarItems.map((Item, i) => <Item key={i} {...rest} />)}
  </div>
}
