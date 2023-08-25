import { useEffect } from 'react'

export function useDocumentEventListener<K extends keyof DocumentEventMap>(
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
  active?: boolean,
  options?: boolean | AddEventListenerOptions
) {
  useEffect(() => {
    if (active === false) return

    document.addEventListener(type, listener, options)
    return () => {
      document.removeEventListener(type, listener, options)
    }
  }, [type, listener, options, active])
}
