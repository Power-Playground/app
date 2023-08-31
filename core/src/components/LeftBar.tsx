import './LeftBar.scss'

import { classnames, messenger } from '@power-playground/core'

const prefix = 'ppd-left-bar'

export interface LeftBarProps {
  style?: React.CSSProperties
  className?: string
}

export function LeftBar(props: LeftBarProps) {
  return <div className={classnames(prefix, props.className)}
              style={props.style}>
    <div className={`${prefix}__top`}>
    </div>
    <div className={`${prefix}__bottom`}>
      <button onClick={() => messenger.then(m => m.display('warning', 'Not implemented yet'))}>
        <span className='cldr codicon codicon-gear'></span>
      </button>
    </div>
  </div>
}
