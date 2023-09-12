import './HelpTip.scss'

import type { ReactNode } from 'react'
import { useState } from 'react'

export type IHelpTip = [node: ReactNode, probability: number]

export interface HelpTipProps {
  tips: IHelpTip[]
}

HelpTip.prefix = 'ppd-help-tip'
export function HelpTip(props: HelpTipProps) {
  const {
    prefix
  } = HelpTip
  const {
    tips
  } = props
  const [helpTip, setHelpTip] = useState<IHelpTip | undefined>(getAHelpTip.bind(null, tips))

  return helpTip ? <div className={prefix}>
    <span className={`${prefix}__content`}>
      {helpTip[0]}
    </span>
    <div className={`${prefix}__opts`}>
      <span className={`${prefix}__opts__btns`}>
        <button
          title='Hide tip'
          onClick={() => setHelpTip(undefined)}
        >
          <span className='cldr codicon codicon-close' />
        </button>
        <button
          title='Pin tip'
          onClick={() => setHelpTip(undefined)}
        >
          <span className='cldr codicon codicon-pin' />
        </button>
      </span>
      <button onClick={() => setHelpTip(prev => getAHelpTip(tips, prev))}>
        Next tip
        <span className='cldr codicon codicon-fold-up' />
      </button>
    </div>
  </div> : null
}

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
