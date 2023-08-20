import { defineConfigure } from '@power-playground/core'
import { mergeAll } from 'ramda'

import sharePpdClientConfigure from './.share.ppd.client.configure.ts'

export default mergeAll([
  defineConfigure({
  }),
  sharePpdClientConfigure
])
