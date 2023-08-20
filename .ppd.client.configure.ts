import { defineConfigure } from '@power-playground/core'
import { mergeLeft } from 'ramda'

import sharePpdClientConfigure from './.share.ppd.client.configure.ts'

export default mergeLeft(
  defineConfigure({
  }),
  sharePpdClientConfigure
)
