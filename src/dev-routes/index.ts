import React from 'react'

const devRouteModules = import.meta
  .glob('./*Demo.tsx') as unknown as Record<string, () => Promise<{
  default: React.ComponentType<unknown>
}>>
console.log(devRouteModules)
export const devRoutesMap = new Map<string, React.LazyExoticComponent<React.ComponentType<unknown>>>()
Object.entries(devRouteModules).forEach(([path, route]) => {
  devRoutesMap.set(
    path
      .replace('./', '')
      .replace('.tsx', '')
      .replace(/Demo$/, ''),
    React.lazy(route)
  )
})
