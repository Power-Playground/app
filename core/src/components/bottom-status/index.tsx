import './index.scss'

import React from 'react'

import { GoToLC } from './GoToLC.tsx'
import { Help } from './Help.tsx'
import { History } from './History.tsx'
import { TypescriptVersionStatus } from './TypescriptVersionStatus.tsx'

const prefix = 'ppd-bottom-status'

export function BottomStatus() {
  return <div className={`monaco-editor ${prefix}`}>
    <Help />
    <History />
    <TypescriptVersionStatus />
    <GoToLC />
  </div>
}
