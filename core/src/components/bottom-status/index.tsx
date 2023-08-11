import './index.scss'

import React, { useContext, useMemo } from 'react'

import { ExtensionContext } from '../EditorZone.tsx'

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
    {statusBarItems.map((Item, i) => <Item key={i} {...rest} />)}
    <Help />
    <History />
    <GoToLC />
  </div>
}
