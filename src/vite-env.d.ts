/// <reference types="vite/client" />

declare global {
  export function onThemeChange(fn: (theme: string, isAuto: boolean) => void): void
}

export {}

