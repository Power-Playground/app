import type { VFile } from './virtual-files'
import { createSetVFile } from './virtual-files'

describe('VirtualFiles', () => {
  const vFiles: VFile[] = []
  const _setVFiles: (arg0: (vFiles: VFile[]) => VFile[]) => void = arg0 => {
    vFiles.push(...arg0(vFiles))
    console.log(vFiles)
  }
  const setVFiles = createSetVFile(_setVFiles)
  it('should be tested', () => {
    setVFiles({ path: '/a/b/c' }, undefined)
  })
})
