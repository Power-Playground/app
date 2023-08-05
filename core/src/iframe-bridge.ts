interface IframeEvent {
  type: string
  data?: unknown
}

export class IframeBridge<
  Events0 extends IframeEvent,
  Events1 extends IframeEvent = never,
> {
  private readonly listeners: Map<string, Function[]> = new Map()

  constructor(
    private readonly w: () => (Window | null),
    private readonly targetOrigin: string
  ) {
    window.addEventListener('message', e => {
      if (e.origin !== targetOrigin) {
        return
      }
      const listeners = this.listeners.get(e.data.type)
      if (listeners) {
        listeners.forEach(func => func(e.data.data))
      }
    })
  }

  send<
    T extends Events0['type']
  >(type: T, data?: Extract<Events0, { type: T }>['data']) {
    this.w()?.postMessage({ type, data }, this.targetOrigin)
  }

  on<
    T extends Events1['type']
  >(type: T, func: (data: Extract<Events1, { type: T }>['data']) => void) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.push(func)
    } else {
      this.listeners.set(type, [func])
    }
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(func)
        if (index !== -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }
}
