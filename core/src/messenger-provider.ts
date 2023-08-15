export interface Messenger {
  display(
    type:
      | 'success'
      | 'info'
      | 'warning'
      | 'error',
    message: React.ReactNode,
    options?: {
      duration?: number
      closable?: boolean
      position?:
        | 'top-center'
        | 'top-right'
        | 'bottom-center'
        | 'bottom-right'
    }
  ): void
}

let instance: Messenger | null = null

let messengerPromiseResolve: (messenger: Messenger) => void

export const messenger: Promise<Messenger> = new Promise((resolve) => {
  if (instance) {
    resolve(instance)
  } else {
    messengerPromiseResolve = resolve
  }
})

export function provideMessenger(messenger: Messenger) {
  instance = messenger
  messengerPromiseResolve(messenger)
}
