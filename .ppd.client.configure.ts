import { defineConfigure } from '@power-playground/core'
import { mergeDeepLeft } from 'ramda'

import sharePpdClientConfigure from './.share.ppd.client.configure.ts'

export default mergeDeepLeft(
  defineConfigure({
  }),
  sharePpdClientConfigure
)
