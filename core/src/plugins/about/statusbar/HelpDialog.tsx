import './HelpDialog.scss'

import { forwardRef } from 'react'
import { isMacOS } from '@power-playground/core'

import type { DialogRef } from '../../../components/base/Dialog'
import { Dialog } from '../../../components/base/Dialog'

export const HelpDialog = forwardRef<DialogRef>(function HelpDialog({ }, ref) {
  const cmdOrCtrl = isMacOS ? '⌘' : 'Ctrl'
  const ctrl = isMacOS ? '⌃' : 'Ctrl'

  const keymap = [
    [cmdOrCtrl, 'S', '保存并复制链接'],
    [cmdOrCtrl, 'E', '执行代码'],
    [cmdOrCtrl, 'H', <>历史代码（<span className='keymap__key' style={{ userSelect: 'none' }}>
      <kbd>{cmdOrCtrl}</kbd> <kbd>S</kbd>
    </span>保存下来的代码）</>],
    [ctrl, '/', '查看帮助']
  ]
  return <Dialog
    ref={ref}
    binding={e => e.key === '/' && (e.metaKey || e.ctrlKey)}
    title='Help'
    className='ppd-help-dialog'
    style={{
      '--width': '40vw',
      '--max-height': '80vh'
    }}
    >
    <div className='ppd-tabs-wrapper'>
      <div className='ppd-tabs'>
        <div className='ppd-tabs__item ppd-tabs__item--active'>快捷键</div>
        <div className='ppd-tabs__item'>支持的语言</div>
      </div>
      <div className='ppd-tab-content'>
        <div className='ppd-list'>
          {keymap.map(([key, key2, desc], i) => <div key={i} className='ppd-list__item'>
            <div className='description'>
              {desc}
            </div>
            <span className='keymap__key' style={{ userSelect: 'none' }}>
              <kbd>{key}</kbd> <kbd>{key2}</kbd>
            </span>
          </div>)}
        </div>
      </div>
    </div>
  </Dialog>
})
