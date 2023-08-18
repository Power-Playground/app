import './Switcher.scss'

import type { ReactNode } from 'react'
import { useRef, useState } from 'react'

const prefix = 'ppd-switcher'

export interface SwitcherProps {
  style?: React.CSSProperties & {
    '--gap'?: string
    '--bor-size'?: string
  }

  value: boolean
  onChange: (value: boolean) => void
  lText?: ReactNode
  rText?: ReactNode
}

export function Switcher(props: SwitcherProps) {
  const { value, onChange } = props
  const widthCacheRef = useRef<[number?, number?]>([])
  const [cardWidth, setCardWidth] = useState(0)
  const change = (val: boolean) => {
    value !== val && onChange(val)
    setCardWidth(widthCacheRef.current[val ? 0 : 1]!)
  }
  return <div className={prefix} style={props.style}>
    <div
      ref={el => (widthCacheRef.current[0] = el?.offsetWidth || 0, change(value))}
      className={`${prefix}__item`}
      onClick={() => change(true)}
    >
      {props.rText}
    </div>
    <div
      ref={el => (widthCacheRef.current[1] = el?.offsetWidth || 0, change(value))}
      className={`${prefix}__item`}
      onClick={() => change(false)}
    >
      {props.lText}
    </div>
    <div
      className={`${prefix}__item--bar`}
      style={{
        transform: `translateX(calc(${value ? 0 : (widthCacheRef.current[0] ?? 0)}px + var(--gap) * ${value ? 0 : 1}))`,
        width: cardWidth
      }}
    />
  </div>
}
