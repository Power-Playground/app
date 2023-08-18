import './TopBar.scss'

import { useContext, useMemo } from 'react'
import { classnames } from '@power-playground/core'
import { displayLeftBarAtom } from '@power-playground/core/components/EditorZoneShareAtoms.ts'
import { useAtom } from 'jotai'

import { ExtensionContext } from '../contextes/Extension'

const prefix = 'ppd-top-bar'

export function TopBar({
  enableMenuSwitch = true
}: {
  enableMenuSwitch?: boolean
}) {
  const { plugins, ...rest } = useContext(ExtensionContext)

  const topBarItems = useMemo(() => plugins
    .filter(plugin => plugin.editor?.topbar)
    .flatMap(plugin => plugin.editor?.topbar ?? []), [plugins])
  const [displayLeftBar, setDisplayLeftBar] = useAtom(displayLeftBarAtom)

  return <div className={classnames(
    prefix,
    enableMenuSwitch
      ? 'display-menu'
      : undefined
  )}>
    {enableMenuSwitch && <div
      className={classnames('menu-switch', {
        'is-active': displayLeftBar
      })}
      title='display left zone.'
      onClick={() => setDisplayLeftBar(!displayLeftBar)}
    >
      <div className='cldr codicon codicon-menu' />
    </div>}
    {topBarItems.map((Item, i) => <Item key={i} {...rest} />)}
  </div>
}
