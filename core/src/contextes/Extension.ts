import { createContext } from 'react'

import type { Plugin } from '../plugins'
import type { BarItemProps } from '../plugins'

export const ExtensionContext = createContext<BarItemProps<unknown> & { plugins: Plugin[] }>({
  plugins: [],
  searchParams: new URLSearchParams(),
  shareState: {}
})
