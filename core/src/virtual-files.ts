import { useCallback, useMemo } from 'react'
import { atom, useAtom, useStore } from 'jotai'

import { pipply } from './kits/pipply'

type VFile = {
  path: string
  readonly data?: Record<string, unknown>
  readonly filename: string
  readonly extname: string
  readonly dirname: string
  readonly basename: string
  readonly isLink: boolean
  readonly isDirectory: boolean
  readonly isBuffer?: boolean
} & (
  | {
    readonly isBuffer: true
    readonly contents: Buffer
  }
  | {
    readonly isBuffer?: false
    readonly contents: string
  }
)

export const VFileLinkPath = Symbol('VFileLinkPath')

export interface CreateVFileProps<
  C extends string | Buffer
> {
  path: string, contents: C, data?: Record<string | symbol, unknown>
}
export const createVFile = <
  C extends string | Buffer,
  IsBuffer extends boolean = C extends Buffer ? true : false
>({ path, contents, data }: CreateVFileProps<C>) => ({
    path,
    data,
    contents,
    get basename() { return path.slice(path.lastIndexOf('/') + 1) },
    get filename() { return this.basename + this.extname },
    get extname() { return path.slice(path.lastIndexOf('.')) },
    get dirname() { return path.slice(0, path.lastIndexOf('/')) },
    get isLink() {
      return data?.[VFileLinkPath] != null
    },
    get isDirectory() {
      return this.path.endsWith('/')
    },
    get isBuffer() {
      return Buffer.isBuffer(this.contents) as IsBuffer
    }
  })

export const vFilesAtom = atom<VFile[]>([])

export type UseVFilesReturn = ReturnType<typeof useVFiles>

export const useVFiles = () => {
  const [
    vFiles, setVFiles
  ] = useAtom(vFilesAtom, { store: useStore() })
  const setVFile = useMemo(() => pipply(createVFile, (rt, index?: number) => {
    const rtAlias = rt as VFile
    if (index === undefined) {
      setVFiles(vFiles => [...vFiles, rtAlias])
    } else if (index === -1) {
      setVFiles(vFiles => [rtAlias, ...vFiles])
    } else {
      setVFiles(vFiles => {
        const nt = [...vFiles]
        nt[index] = rtAlias
        return nt
      })
    }
    return rt
  }), [setVFiles])
  const removeVFile = useCallback((path: string) => {
    setVFiles(vFiles.filter(vFile => vFile.path !== path))
  }, [vFiles, setVFiles])
  const removeAllVFiles = useCallback(() => {
    setVFiles([])
  }, [setVFiles])
  const getVFile = useCallback((path: string) => {
    return vFiles.find(vFile => vFile.path === path)
  }, [vFiles])

  return [vFiles, setVFiles, useMemo(() => ({
    setVFile,
    removeVFile,
    removeAllVFiles,
    getVFile
  }), [getVFile, removeAllVFiles, removeVFile, setVFile])] as const
}
