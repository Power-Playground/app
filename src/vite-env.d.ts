/// <reference types="vite/client" />

declare global {
  export function onThemeChange(fn: (theme: string, isAuto: boolean) => void): void
  // eslint-disable-next-line no-var
  export var __DEBUG__: boolean
  // eslint-disable-next-line no-var
  export var __PPD_PLUGINS_GLOB_PATHS__: string[]
  // eslint-disable-next-line no-var
  export var __CLIENT_CONFIGURE_PATH__: string
  // eslint-disable-next-line no-var
  export var PPD_HEADER_TITLE_JUMP_LINK: string | undefined
  // eslint-disable-next-line no-var
  export var PPD_GITHUB_URL: string | undefined
}

export {}

