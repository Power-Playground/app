import './Share.scss'

import React, { useEffect, useState } from 'react'
import type { VirtualElement } from '@popperjs/core'
import type { BarItemProps } from '@power-playground/core'
import { messenger } from '@power-playground/core'

import { Popover } from '../../../components/base/Popover'
import { NotImplemented } from '../../../components/NotImplemented'
import { createPointVEle, usePopper } from '../../../hooks/usePopper'
import { isMacOS } from '../../../utils'

const prefix = 'social__share'

export const Share: React.ComponentType<BarItemProps> = () => {
  const [vEle, setVEle] = useState<VirtualElement | null>(null)
  const { popper, visible, changeVisible, whenClickOtherAndHide } = usePopper({
    referenceElement: vEle,
    className: 'ppd-contextmenu',
    content: <>
      <div className='ppd-contextmenu__item' tabIndex={0}>
        <span className='cldr codicon codicon-issues' />
        Copy as Markdown Issue
      </div>
      <div className='ppd-contextmenu__item' tabIndex={0}>
        <span className='cldr codicon codicon-link' />
        Copy as Markdown Link
      </div>
      <div className='ppd-contextmenu__item' tabIndex={0}>
        <span className='cldr codicon codicon-file-media' />
        Copy as Markdown with Image
      </div>
      <div className='ppd-contextmenu__item' tabIndex={0}>
        <span className='cldr codicon codicon-twitter' />
        Share to Twitter
      </div>
      <div className='ppd-contextmenu__item' tabIndex={0}>
        <span>□</span>
        Open in CodeSandbox
      </div>
      <div className='ppd-contextmenu__item' tabIndex={0}>
        <span>⚡️</span>
        Open in StackBlitz
      </div>
    </>,
    placement: 'right-start',
    arrowVisible: false
  })
  useEffect(() => {
    function withOffClick (e: MouseEvent) {
      whenClickOtherAndHide(e)
      removeEventListener('click', withOffClick)
    }
    if (visible) {
      const t = setTimeout(() => addEventListener('click', withOffClick), 100)
      return () => {
        clearTimeout(t)
        removeEventListener('click', withOffClick)
      }
    }
  }, [whenClickOtherAndHide, visible])
  return <>
    {popper}
    <Popover
      className={prefix}
      style={{ order: -99 }}
      placement='top'
      content={<>
        Share to Social
        &nbsp;&nbsp;
        <kbd>{isMacOS ? '⌘' : 'Ctrl'} + SHIFT + S</kbd>
        <br />
        <span style={{ color: 'gray' }}>(Change mode by context menu.)</span>
      </>}
      offset={[0, 6]}
      >
      <button
        onClick={() => messenger.then(m => m.display('warning', <NotImplemented />))}
        onContextMenu={e => {
          e.preventDefault()
          setVEle(createPointVEle(e.clientX, e.clientY))
          changeVisible(true)
        }}
      >
        <span className='cldr codicon codicon-link' style={{ transform: 'rotate(-45deg)' }} />
      </button>
      <span
        className='ppd-contextmenu__trigger cldr codicon codicon-triangle-right'
        onClick={e => {
          setVEle(createPointVEle(e.clientX, e.clientY))
          changeVisible(true)
        }}
      />
    </Popover>
  </>
}
