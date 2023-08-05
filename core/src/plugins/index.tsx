import type * as UITypes from '//chii/ui/legacy/legacy.js'
import type { ReactElement } from 'react'
import React from 'react'
import ReactDOM from 'react-dom/client'

import { DevtoolsWindow } from '../pages/eval-logs/devtools.ts'

type TraverseNextNode = (stayWithin?: Node) => Node | null

export type Render = (devtoolsWindow: DevtoolsWindow, UI: typeof UITypes) => typeof UITypes.Widget.Widget
export type ReactRender = (props: {
  devtoolsWindow: DevtoolsWindow,
  UI: typeof UITypes,
  onTraverseNextNode: (lis: TraverseNextNode) => () => void
}) => ReactElement

type PanelMeta = {
  id: string
  type?: 'react'
  title: string
}

type Panel = PanelMeta & Render

function isReactRender(
  tuple: readonly [type: string, render: Render | ReactRender]
): tuple is ['react', ReactRender] {
  const [type, render] = tuple
  return type === 'react' && typeof render === 'function'
}

export function defineDevtoolsPanel(
  id: string, title: string, render: Render
): PanelMeta & Render
export function defineDevtoolsPanel(
  id: string, title: string, type: 'react', render: ReactRender
): PanelMeta & Render & { type: 'react' }
export function defineDevtoolsPanel(
  id: string, title: string, typeOrRender: string | Render, render?: Render | ReactRender
): Panel {
  if (typeof typeOrRender === 'string') {
    if (!render)
      throw new Error('render is required')

    const tuple = [typeOrRender, render] as const
    if (isReactRender(tuple)) {
      const [type, Render] = tuple
      const newRender: Render = (devtoolsWindow, UI) => {
        return class extends UI.Widget.Widget {
          constructor() {
            super()
            const root = document.createElement('div') as HTMLDivElement & {
              traverseNextNode(stayWithin?: Node): Node | null
            }
            root.traverseNextNode = () => null

            this.element.appendChild(root)
            ReactDOM.createRoot(root)
              .render(<Render {...{
                UI,
                devtoolsWindow,
                onTraverseNextNode: lis => {
                  root.traverseNextNode = lis
                  return () => root.traverseNextNode = () => null
                }
              }} />)
          }
        }
      }
      return Object.assign(newRender, { id, type, title })
    }
    throw new Error('render must be a function')
  }
  const rtRender = typeOrRender as PanelMeta & Render
  rtRender.id = id
  rtRender.title = title
  return rtRender
}

export function definePlugins(props: {
  editor?: (monaco: typeof import('monaco-editor')) => () => void
  devtools?: {
    panels?: Panel[]
  }
}) { return props }
