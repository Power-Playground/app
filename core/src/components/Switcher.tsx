import './Switcher.scss'

import type { ReactNode } from 'react'
import { useRef, useState } from 'react'

export interface SwitcherProps {
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
  return <div className='switcher'>
    <div
      ref={el => (widthCacheRef.current[0] = el?.offsetWidth || 0, change(value))}
      className='switcher__item'
      onClick={() => change(true)}
    >
      {props.rText}
    </div>
    <div
      ref={el => (widthCacheRef.current[1] = el?.offsetWidth || 0, change(value))}
      className='switcher__item'
      onClick={() => change(false)}
    >
      {props.lText}
    </div>
    <div
      className='switcher__item--bar'
      style={{
        transform: `translateX(${value ? 0 : (widthCacheRef.current[0] ?? 0) + 5}px)`,
        width: cardWidth
      }}
    />
  </div>
}
