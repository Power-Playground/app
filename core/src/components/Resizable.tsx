import './Resizable.scss'

import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'

import { classnames } from '../utils'

export interface ResizableProps extends Omit<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  'ref' | 'style' | 'className' | 'children'
> {
  ref?: React.RefCallback<HTMLDivElement> | React.RefObject<HTMLDivElement> | null
  className?: string
  style?: CSSProperties & {
    '--border-width'?: string
    '--border-scale'?: string | number
  }
  children?: React.ReactNode

  resizable?:
    | boolean
    | [LefAndRight?: boolean, TopAndBottom?: boolean]
    | [Left?: boolean, Right?: boolean, Top?: boolean, Bottom?: boolean]
    | {
      left?: boolean
      right?: boolean
      top?: boolean
      bottom?: boolean
    }

  onBorderBtnClick?: (
    type: 'left' | 'right' | 'top' | 'bottom',
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    args: { type: string }
  ) => void
}

function resolveResizable(resizable?: ResizableProps['resizable']): [
  Left?: boolean, Right?: boolean, Top?: boolean, Bottom?: boolean
] {
  if (resizable === undefined) return [true, true, true, true]
  if (resizable === false) return [false, false, false, false]
  if (Array.isArray(resizable)) {
    const [left, right, top, bottom] = resizable
    return [left ?? false, right ?? false, top ?? false, bottom ?? false]
  }
  if (typeof resizable === 'object') {
    const { left, right, top, bottom } = resizable
    return [left ?? false, right ?? false, top ?? false, bottom ?? false]
  }
  return [false, false, false, false]
}

const prefix = 'ppd-resizable'

function mountResize(
  ele: HTMLDivElement
) {
  const gets = {
    get MIN_WIDTH() {
      return getComputedStyle(ele, '')
        .getPropertyValue('min-width')
    },
    get MIN_HEIGHT() {
      return getComputedStyle(ele, '')
        .getPropertyValue('min-height')
    }
  }
  let mPos: number
  let isClick = false

  function resize(isVertical: boolean, sym: 1 | -1, e: MouseEvent) {
    const [
      field0,
      field1
    ] = [
      isVertical ? 'y' : 'x',
      isVertical ? 'height' : 'width'
    ] as const
    const d = e[field0] - mPos
    const newVal = (parseInt(getComputedStyle(ele, '')[field1]) + d * sym)

    mPos = e[field0]
    ele.style[field1] = newVal + 'px'
  }
  const registerResizeFuncs = [] as ((e: MouseEvent) => void)[]
  function elMouseDown(e: MouseEvent) {
    const target = e.target as HTMLDivElement
    const [left, right, top, bottom] = [
      target?.classList?.contains(
        `${prefix}-border__left`
      ),
      target?.classList?.contains(
        `${prefix}-border__right`
      ),
      target?.classList?.contains(
        `${prefix}-border__top`
      ),
      target?.classList?.contains(
        `${prefix}-border__bottom`
      )
    ]
    const [leftOrRight, topOrBottom] = [
      left || right,
      top || bottom
    ]
    if (!leftOrRight && !topOrBottom) return

    mPos = leftOrRight ? e.pageX : e.pageY

    if (!isClick) {
      isClick = true
      setTimeout(() => isClick = false, 1000)
    } else {
      if (leftOrRight) ele.style.width = gets.MIN_WIDTH
      if (topOrBottom) ele.style.height = gets.MIN_HEIGHT
    }
    document
      .querySelectorAll('iframe')
      .forEach(e => e.style.pointerEvents = 'none')
    const _resize = resize.bind(null, topOrBottom, right || bottom ? 1 : -1)
    registerResizeFuncs.push(_resize)
    document.addEventListener('mousemove', _resize, false)
    ele.style.userSelect = 'none'
    e.stopPropagation()
  }
  function onGlobalMouseUp() {
    registerResizeFuncs
      .forEach(f => document.removeEventListener('mousemove', f, false))
    document
      .querySelectorAll('iframe')
      .forEach(e => e.style.pointerEvents = 'auto')
    ele.style.userSelect = 'auto'
  }

  ele.addEventListener('mousedown', elMouseDown, false)
  document.addEventListener('mouseup', onGlobalMouseUp)
  return () => {
    ele.removeEventListener('mousedown', elMouseDown)
    document.removeEventListener('mouseup', onGlobalMouseUp)
  }
}

export function Resizable({
  className,
  style,
  children,
  ref,
  resizable,
  onBorderBtnClick,
  ...props
}: ResizableProps) {
  const resizableDivRef = useRef<HTMLDivElement>(null)
  const [left, right, top, bottom] = resolveResizable(resizable)
  useEffect(() => {
    if (resizableDivRef.current === null) return

    if (top === false || bottom === false) {
      resizableDivRef.current.style.height = typeof style?.height === 'number'
        ? style.height + 'px'
        : style?.height ?? 'inherit'
    }
  }, [top, bottom, style?.height])
  useEffect(() => {
    if (resizableDivRef.current === null) return

    if (left === false || right === false) {
      resizableDivRef.current.style.width = typeof style?.width === 'number'
        ? style.width + 'px'
        : style?.width ?? 'inherit'
    }
  }, [left, right, style?.width])

  const dispose = useRef<() => void>()
  return <div
    className={classnames(
      prefix, className,
      left && `${prefix}__left`,
      right && `${prefix}__right`,
      top && `${prefix}__top`,
      bottom && `${prefix}__bottom`
    )}
    style={style}
    ref={async ele => {
      if (typeof ref === 'function') {
        ref(ele)
      } else if (ref) {
        // @ts-ignore
        props.ref.current = ele
      }
      if (!ele) {
        dispose.current?.()
        return
      }

      // @ts-ignore
      resizableDivRef.current = ele
      dispose.current = mountResize(ele)
    }}
    {...props}
    >
    {children}
    {left && <div
      className={`${prefix}-border ${prefix}-border__left`}
    >
      {onBorderBtnClick && <div className={`${prefix}-border__btns`}>
        <button onClick={e => onBorderBtnClick?.(
          'left', e, {
            type: 'full'
          })}>
          <span className='cldr codicon codicon-debug-continue-small' style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>}
    </div>}
    {right && <div
      className={`${prefix}-border ${prefix}-border__right`}
    >
      {onBorderBtnClick && <div className={`${prefix}-border__btns`}>
        <button onClick={e => onBorderBtnClick?.(
          'right', e, {
            type: 'full'
          })}>
          <span className='cldr codicon codicon-debug-continue-small' />
        </button>
      </div>}
    </div>}
    {top && <div
      className={`${prefix}-border ${prefix}-border__top`}
    >
      {onBorderBtnClick && <div className={`${prefix}-border__btns`}>
        <button onClick={e => onBorderBtnClick?.(
          'top', e, {
            type: 'full'
          })}>
          <span className='cldr codicon codicon-debug-continue-small' style={{ transform: 'rotate(270deg)' }} />
        </button>
      </div>}
    </div>}
    {bottom && <div
      className={`${prefix}-border ${prefix}-border__bottom`}
    >
      {onBorderBtnClick && <div className={`${prefix}-border__btns`}>
        <button onClick={e => onBorderBtnClick?.(
          'bottom', e, {
            type: 'full'
          })}>
          <span className='cldr codicon codicon-debug-continue-small' style={{ transform: 'rotate(90deg)' }} />
        </button>
      </div>}
    </div>}
  </div>
}
