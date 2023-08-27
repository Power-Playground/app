import './LeftBar.scss'

import { classnames } from '@power-playground/core'

const prefix = 'ppd-left-bar'

export interface LeftBarProps {
  style?: React.CSSProperties
  className?: string
}

export function LeftBar(props: LeftBarProps) {
  return <div className={classnames(prefix, props.className)}
              style={props.style}>
  </div>
}
