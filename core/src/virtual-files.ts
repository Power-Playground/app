import { useCallback, useMemo } from 'react'
import { atom, useAtom, useStore } from 'jotai'

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

interface Pipply {
  <A0, T0, B0, T1>(fn: (a0: A0) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, b0: B0) => T1
  <A0, A1, T0, B0, T1>(fn: (a0: A0, a1: A1) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, b0: B0) => T1
  <A0, A1, A2, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, b0: B0) => T1
  <A0, A1, A2, A3, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, b0: B0) => T1
  <A0, A1, A2, A3, A4, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, b0: B0) => T1
  <A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, T0, B0, T1>(fn: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, a10: A10) => T0, fn2: (rt: T0, b0: B0) => T1): (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9, a10: A10, b0: B0) => T1
}
const pipply: Pipply = (fn: Function, fn2: Function) => (...args: unknown[]) => fn2(
  fn(...args.slice(0, args.length - 1)),
  args[args.length - 1]
)

export const vFilesAtom = atom<VFile[]>([])

export const useVFiles = () => {
  const [
    vFiles, setVFiles
  ] = useAtom(vFilesAtom, { store: useStore() })
  return {
    vFiles,
    setVFiles,
    setVFile: useMemo(() => pipply(createVFile, (rt, index?: number) => {
      const rtAlias = rt as VFile
      if (index === undefined) {
        setVFiles([...vFiles, rtAlias])
      } else if (index === -1) {
        setVFiles([rtAlias, ...vFiles])
      } else {
        const nt = [...vFiles]
        nt[index] = rtAlias
        setVFiles(nt)
      }
      return rt
    }), [vFiles, setVFiles]),
    removeVFile: useCallback((path: string) => {
      setVFiles(vFiles.filter(vFile => vFile.path !== path))
    }, [vFiles, setVFiles]),
    removeAllVFiles: useCallback(() => {
      setVFiles([])
    }, [setVFiles]),
    getVFile: useCallback((path: string) => {
      return vFiles.find(vFile => vFile.path === path)
    }, [vFiles])
  }
}
