/// <reference types="vite/client" />

declare global {
  export function onThemeChange(fn: (theme: string, isAuto: boolean) => void): void
  // eslint-disable-next-line no-var
  export var __DEBUG__: boolean
}

export {}

