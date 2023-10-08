import type { VFile } from './virtual-files'
import { createSetVFile } from './virtual-files'

describe('VirtualFiles', () => {
  let vFiles: VFile[] = []
  const _setVFiles: (arg0: (vFiles: VFile[]) => VFile[]) => void = arg0 => {
    vFiles = arg0(vFiles)
    console.log(vFiles.map(f => f.path))
  }
  const setVFiles = createSetVFile(_setVFiles)
  it('should be tested', () => {
    setVFiles({ path: '/a/b/c', contents: '' }, undefined)
    setVFiles({ path: '/a/b/d', contents: '' }, undefined)
    setVFiles({ path: '/a/b/e', contents: '' }, undefined)
  })
})
