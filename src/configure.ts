// @replacer.use.define.__CLIENT_CONFIGURE_PATH__
import type { Configure } from '@power-playground/core'

export default (
  import.meta.glob(
    __CLIENT_CONFIGURE_PATH__, { eager: true }
  )
    ?.[__CLIENT_CONFIGURE_PATH__]
    // @ts-ignore
    ?.default
  ?? {}
) as Configure
