import './HelpTip.scss'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import { classnames } from '../../utils'

import { forwardRefWithStatic } from './forwardRefWithStatic'

export type IHelpTip = [node: ReactNode, probability: number]

export interface HelpTipProps {
  tips: IHelpTip[]
  storageKey?: string
}

export interface HelpTipRef {
  display: () => void
}

export const HelpTip = forwardRefWithStatic<{
  prefix: string
}, HelpTipRef, HelpTipProps>((props, _ref) => {
  const {
    prefix
  } = HelpTip
  const {
    tips,
    storageKey
  } = props
  const ele = useRef<HTMLDivElement>(null)
  const getAHelpTipForThis = useMemo(() => getAHelpTip.bind(null, tips), [tips])
  const [isDisplay, setIsDisplay] = useState(() => {
    if (storageKey) {
      const isDisplay = localStorage.getItem(`${storageKey}--isDisplay`)
      if (isDisplay === 'true') {
        return true
      } else if (isDisplay === 'false') {
        return false
      }
    }
    return true
  })
  const changeIsDisplay = useCallback<typeof setIsDisplay>(newIsDisplay => {
    console.log('changeIsDisplay', newIsDisplay)
    if (typeof newIsDisplay === 'function') {
      setIsDisplay(prevIsDisplay => {
        const nIsDisplay = newIsDisplay(prevIsDisplay)
        if (storageKey) {
          localStorage.setItem(`${storageKey}--isDisplay`, nIsDisplay.toString())
        }
        return nIsDisplay
      })
    } else {
      setIsDisplay(newIsDisplay)
      if (storageKey) {
        localStorage.setItem(`${storageKey}--isDisplay`, newIsDisplay.toString())
      }
    }
  }, [storageKey])
  const [pinned, setPinned] = useState(() => {
    if (storageKey) {
      const pinned = localStorage.getItem(`${storageKey}--pinned`)
      if (pinned === 'true') {
        return true
      } else if (pinned === 'false') {
        return false
      }
    }
    return false
  })
  const changePinned = useCallback<typeof setPinned>(newPinned => {
    if (typeof newPinned === 'function') {
      setPinned(prevIsPinned => {
        const nPinned = newPinned(prevIsPinned)
        if (storageKey) {
          localStorage.setItem(`${storageKey}--pinned`, nPinned.toString())
        }
        return nPinned
      })
    } else {
      setPinned(newPinned)
      if (storageKey) {
        localStorage.setItem(`${storageKey}--pinned`, newPinned.toString())
      }
    }
  }, [storageKey])
  const [helpTip, setHelpTip] = useState<IHelpTip | undefined>(getAHelpTipForThis)
  const resetAnimation = useCallback(() => {
    const opts = ele.current?.querySelector<HTMLDivElement>(`.${prefix}__opts__line`)
    if (opts) {
      opts.style.animation = 'none'
      // noinspection BadExpressionStatementJS
      opts.offsetHeight
      opts.style.animation = ''
    }
  }, [prefix])
  const updateHelpTip = useCallback(() => {
    resetAnimation()
    clearTimeout(timer.current)
    setHelpTip(prev => getAHelpTipForThis(prev))
  }, [resetAnimation, getAHelpTipForThis])
  const timer = useRef<number>()
  const prevMillionSeconds = useRef<number>()
  const stopMillionSeconds = useRef<number>()
  const durationMillionSeconds = useRef<number>()
  const setTimer = useCallback((time = 5000) => {
    if (pinned) return

    clearTimeout(timer.current)
    prevMillionSeconds.current = Date.now()
    timer.current = setTimeout(() => {
      setHelpTip(prev => getAHelpTipForThis(prev))
      durationMillionSeconds.current = 0
    }, time) as unknown as number
  }, [getAHelpTipForThis, pinned])
  useEffect(() => {
    if (helpTip) {
      prevMillionSeconds.current = stopMillionSeconds.current = Date.now()
      durationMillionSeconds.current = 0
      setTimer()
    }
    return () => {
      resetAnimation()
      clearTimeout(timer.current)
    }
  }, [helpTip, resetAnimation, setTimer])

  useImperativeHandle(_ref, () => ({
    display: () => {
      changeIsDisplay(true)
      updateHelpTip()
    }
  }), [changeIsDisplay, updateHelpTip])
  return helpTip && isDisplay ? <div
    ref={ele}
    className={classnames(prefix, {
      [`${prefix}--pinned`]: pinned
    })}
    onMouseEnter={() => {
      clearTimeout(timer.current)
      stopMillionSeconds.current = Date.now()
    }}
    onMouseLeave={() => {
      if (
        !pinned
        && stopMillionSeconds.current
        && prevMillionSeconds.current
      ) {
        durationMillionSeconds.current =
          (durationMillionSeconds.current ?? 0) +
          (stopMillionSeconds.current - prevMillionSeconds.current)

        setTimer(5000 - durationMillionSeconds.current)
      }
    }}
    >
    <span className={`${prefix}__content`}>
      {helpTip[0]}
    </span>
    <div className={`${prefix}__opts`}>
      <div className={`${prefix}__opts__line`} />
      <span className={`${prefix}__opts__btns`}>
        <button
          title='Hide tip'
          onClick={() => setHelpTip(undefined)}
        >
          <span className='cldr codicon codicon-remove' />
        </button>
        <button
          title='Hide forever'
          onClick={() => {
            changeIsDisplay(false)
            setHelpTip(undefined)
          }}
        >
          <span className='cldr codicon codicon-close' />
        </button>
        <button
          title={pinned ? 'Unpin tip' : 'Pin tip'}
          onClick={() => {
            changePinned(prevIsPinned => {
              if (prevIsPinned) {
                prevMillionSeconds.current = stopMillionSeconds.current = Date.now()
                durationMillionSeconds.current = 0
                setTimer()
              } else {
                clearTimeout(timer.current)
              }
              return !prevIsPinned
            })
          }}
        >
          <span className={classnames('cldr codicon', {
            'codicon-pin': !pinned,
            'codicon-pinned': pinned
          })} />
        </button>
      </span>
      <button onClick={() => {
        updateHelpTip()
        prevMillionSeconds.current = stopMillionSeconds.current = Date.now()
        durationMillionSeconds.current = 0
      }}>
        Next tip
        <span className='cldr codicon codicon-fold-up' />
      </button>
    </div>
  </div> : null
})
Object.defineProperty(HelpTip, 'prefix', {
  value: 'ppd-help-tip',
  writable: false
})

function getAHelpTip(tips: IHelpTip[], prevTip?: IHelpTip) {
  const realTips = tips.filter(tip => tip !== prevTip)
  const probabilitySum = realTips
    .filter(([_, probability]) => probability > 0)
    .reduce((acc, [_, probability]) => acc + probability, 0)
  const randomNum = Math.random() * probabilitySum
  let sum = 0
  for (const [, value] of Object.entries(realTips)) {
    sum += value[1]
    if (randomNum < sum) {
      return value
    }
  }
}
