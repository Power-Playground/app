import './QuickAccess.scss'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { scrollIntoViewIfNeeded } from '../utils/scrollIntoViewIfNeeded.ts'

class Feature<T> {
  static create<T>() {
    return new Feature<T>()
  }

  #promise: Promise<T>
  get promise() {
    return this.#promise
  }
  private resolve: (value: T) => void
  private reject: (reason?: any) => void
  constructor() {
    let r0: (value: T) => void, r1: (reason?: any) => void
    this.#promise = new Promise<T>((resolve, reject) => {
      r0 = resolve
      r1 = reject
    })
    this.resolve = r0!
    this.reject = r1!
  }
  complete(value: T) {
    this.resolve(value)
  }
  fail(reason?: any) {
    this.reject(reason)
  }
  reset() {
    this.#promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    return this
  }
}

// TODO export as util function
function useDocumentEventListener<K extends keyof DocumentEventMap>(
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

export interface QuickAccessProps {
  selector?: string
}

type Awaitable<T> = T | Promise<T>

export namespace QuickAccess {
  export type Result =
  | {
    id: string
    value?: unknown
  }
  | {
    text: string
  }
  export type CommandHandlerResult = {
    id: string
    title?: string
    description?: string
    content?: React.ReactNode
    shortcuts?: string[][]
  }
  export type CommandHandler =
  & ((text?: string) => Awaitable<CommandHandlerResult[]>)
  & {
    defaultId?: string
    options?: {
      placeholder?: string
      defaultText?: string
    }
  }
}

export interface QuickAccessContextValue {
  register: (
    command: string,
    handler: QuickAccess.CommandHandler
  ) => () => void
  asyncFeature: Feature<QuickAccess.Result>
  activeCommandHandler?: QuickAccess.CommandHandler
  onActiveCommandChange: (lis: (command: string) => void) => () => void
  run: (command: string) => Promise<QuickAccess.Result>
}

const commands = new Map<string, QuickAccess.CommandHandler>()

export const createQuickAccessInstance = () => {
  const activeCommandListeners: ((command: string) => void)[] = []
  let activeCommandName: string | null = null
  return {
    asyncFeature: Feature.create<QuickAccess.Result>(),
    onActiveCommandChange(lis) {
      activeCommandListeners.push(lis)
      return () => {
        const index = activeCommandListeners.indexOf(lis)
        if (index !== -1) {
          activeCommandListeners.splice(index, 1)
        }
      }
    },
    run(command) {
      activeCommandName = command
      this.asyncFeature = this.asyncFeature.reset()
      activeCommandListeners.forEach(lis => lis(command))
      return this.asyncFeature.promise
    },
    get activeCommandHandler() {
      return activeCommandName
        ? commands.get(activeCommandName)
        : undefined
    },
    register(command, handler) {
      commands.set(command, handler)
      return () => {
        commands.delete(command)
      }
    }
  } as QuickAccessContextValue
}

export const QuickAccessContext = createContext<QuickAccessContextValue>(null!)

function useActiveHandler(quickAccess: QuickAccessContextValue) {
  const [handler, setHandler] = useState<QuickAccess.CommandHandler>()
  useEffect(() => {
    return quickAccess.onActiveCommandChange(() => {
      setHandler(() => quickAccess.activeCommandHandler)
    })
  }, [quickAccess])
  return handler
}
function useActiveHandlerResults(keyword: string) {
  const handler = useActiveHandler(useContext(QuickAccessContext))
  const [results, setResults] = useState<QuickAccess.CommandHandlerResult[]>([])
  useEffect(() => {
    if (!handler) return

    let canceled = false
    !async function () {
      const results = await handler(keyword)
      if (!canceled) {
        setResults(results)
      }
    }()
    return () => {
      canceled = true
    }
  }, [handler, keyword])
  return results
}

const prefix = 'ppd-quick-access'

export function QuickAccess(props: QuickAccessProps) {
  const { selector } = props

  const focusItemsRef = useRef<(HTMLDivElement | null)[]>([])

  const [keyword, setKeyword] = useState('')
  const keywordRef = useRef(keyword)

  const quickAccess = useContext(QuickAccessContext)

  const inputRef = useRef<HTMLInputElement>(null)
  const [visible, setVisible] = useState(false)
  useLayoutEffect(() => quickAccess.onActiveCommandChange(() => {
    setVisible(true)

    setTimeout(() => inputRef.current?.focus(), 100)
  }), [quickAccess])

  const results = useActiveHandlerResults(keyword)
  const [activeIndex, setActiveIndex] = useState(0)
  const changeActiveIndex = useCallback<typeof setActiveIndex>((arg0) => {
    if (typeof arg0 === 'function') {
      setActiveIndex(i => {
        const index = arg0(i)
        scrollIntoViewIfNeeded(focusItemsRef.current[index]!)
        return index
      })
    } else {
      setActiveIndex(arg0)
      scrollIntoViewIfNeeded(focusItemsRef.current[arg0]!)
    }

  }, [])
  useEffect(() => {
    const index = results.findIndex(({ id }) => id === quickAccess.activeCommandHandler?.defaultId)
    changeActiveIndex(index === -1 ? 0 : index)
  }, [results, quickAccess.activeCommandHandler, changeActiveIndex])
  const handlerOptions = useMemo(() => quickAccess.activeCommandHandler?.options, [quickAccess.activeCommandHandler])
  useDocumentEventListener('keydown', useCallback(e => {
    if (e.key === 'ArrowUp') {
      changeActiveIndex(i => {
        const next = i - 1
        return next < 0 ? results.length - 1 : next
      })
    }
    if (e.key === 'ArrowDown') {
      changeActiveIndex(i => {
        const next = i + 1
        return next >= results.length ? 0 : next
      })
    }
  }, [changeActiveIndex, results]), visible)
  useDocumentEventListener('keydown', useCallback(e => {
    if (e.key === 'Escape') {
      quickAccess.asyncFeature.fail(new Error('canceled'))
      setVisible(false)
    }
    if (e.key === 'Enter') {
      quickAccess.asyncFeature.complete({
        text: keywordRef.current
      })
      setVisible(false)
    }
  }, [quickAccess.asyncFeature]), visible)
  return createPortal(
    <div className={
      `monaco-editor ${prefix}`
      + (visible ? ' visible' : '')
    }>
      <input
        ref={inputRef}
        type='text'
        className={`${prefix} search-box`}
        autoFocus
        onBlur={() => setVisible(false)}
        placeholder={handlerOptions?.placeholder}
        value={keyword}
        defaultValue={handlerOptions?.defaultText}
        onChange={e => (
          setKeyword(e.currentTarget.value),
          keywordRef.current = e.currentTarget.value
        )}
      />
      <div className={`${prefix} results`}>
        {results.map((result, i) => <div
          ref={el => focusItemsRef.current[i] = el}
          key={result.id}
          className={
            `${prefix} result-item`
            + (activeIndex === i ? ' active' : '')
          }
          onClick={() => quickAccess.asyncFeature.complete(result)}
        >
          <div
            className={`${prefix} result-item-id`}
          >
            {result.content ?? result.title}
          </div>
        </div>)}
      </div>
    </div>,
    selector
      ? document.querySelector(selector)!
      : document.body
  )
}
