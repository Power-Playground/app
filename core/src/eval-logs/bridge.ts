import { IframeBridge } from '../iframe-bridge.ts'

export type EvalLogsIframeParentEvent =
| {
  type: 'run'
}
| {
  type: 'compile-completed'
  data: {
    [name: string]: {
      originalText: string
      outputFiles: {
        name: string
        writeByteOrderMark: boolean
        text: string
        tsCompilerResultText: string
      }[],
    }
  }
}
| {
  type: 'update:localStorage'
  data: [key: string, value: any]
}
| {
  type: 'hmr:plugins-update'
}

export type EvalLogsIframeChildEvent =
| {
  type: 'compile'
}
| {
  type: 'dock-to'
  data: 'left' | 'right' | 'bottom' | (string & {})
}

export const bridge = new IframeBridge<EvalLogsIframeParentEvent | EvalLogsIframeChildEvent>(
  () => document.querySelector<HTMLIFrameElement>('iframe.eval-logs')
    ?.contentWindow
    ?? window.parent,
  location.origin
)

export const elBridgeP = bridge as IframeBridge<EvalLogsIframeParentEvent, EvalLogsIframeChildEvent>
export const elBridgeC = bridge as IframeBridge<EvalLogsIframeChildEvent, EvalLogsIframeParentEvent>
