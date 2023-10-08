import { useCallback, useMemo } from 'react'
import type { createStore } from 'jotai'
import { atom, useAtom, useStore } from 'jotai'

import { pipply } from './kits/pipply'

export type VFile = {
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
  path: string, contents?: C, data?: Record<string | symbol, unknown>
}
export const createVFile = <
  C extends string | Buffer,
  IsBuffer extends boolean = C extends Buffer ? true : false
>({ path, contents, data }: CreateVFileProps<C>) => {
  const lastDotIndex = path.lastIndexOf('.')
  return {
    path,
    data,
    contents,
    get basename() {
      return path
        .slice(0, lastDotIndex === -1 ? undefined : lastDotIndex)
        .slice(path.lastIndexOf('/') + 1)
    },
    get filename() {
      return this.basename + this.extname
    },
    get extname() {
      return lastDotIndex === -1 ? '' : path.slice(lastDotIndex)
    },
    get dirname() { return path.slice(0, path.lastIndexOf('/')) },
    get isLink() {
      return data?.[VFileLinkPath] != null
    },
    get isDirectory() {
      return contents === undefined
    },
    get isBuffer() {
      return Buffer.isBuffer(this.contents) as IsBuffer
    }
  }
}

export const createSetVFile = (
  setVFiles: (arg0: (vFiles: VFile[]) => VFile[]) => void
) => pipply(createVFile, (rt, index?: -1 | undefined) => {
  const rtAlias = rt as VFile
  const parents: Iterable<string> = {
    [Symbol.iterator]: function* () {
      let parent = rtAlias.dirname
      while (parent !== '') {
        yield parent
        parent = parent.slice(0, parent.lastIndexOf('/'))
      }
    }
  }
  function autoCreateParent(vFiles: VFile[]) {
    const rtVFiles: VFile[] = []
    let insertIndex = -1
    for (const parent of parents) {
      insertIndex = vFiles.findIndex(vFile => vFile.path === parent)
      if (insertIndex !== -1) break
      rtVFiles.unshift(createVFile({ path: parent }) as VFile)
    }
    return [insertIndex, rtVFiles] as const
  }

  setVFiles(vFiles => {
    const [insertIndex, autoCreateParents] = autoCreateParent(vFiles)
    const [leftVFiles, rightVFiles] = insertIndex === -1
      ? [vFiles, []]
      : [vFiles.slice(0, insertIndex), vFiles.slice(insertIndex)]
    if (index === -1) {
      return [...leftVFiles, ...autoCreateParents, rtAlias, ...rightVFiles]
    } else {
      // TODO insert to the last child of parent
      return [
        ...leftVFiles,
        ...rightVFiles.slice(0, autoCreateParents.length),
        ...autoCreateParents,
        rtAlias,
        ...rightVFiles.slice(autoCreateParents.length)
      ]
    }
  })
  return rt
})

type CreateSetVFileReturn = ReturnType<typeof createSetVFile>

const setVFileFuncMap = new WeakMap<ReturnType<typeof createStore>, CreateSetVFileReturn>()

export const createSetVFileByStore = (store: ReturnType<typeof createStore>) => {
  if (!setVFileFuncMap.has(store)) {
    setVFileFuncMap
      .set(store, createSetVFile(setVFiles => store.set(vFilesAtom, setVFiles)))
  }
  return setVFileFuncMap.get(store)!
}

export const vFilesAtom = atom<VFile[]>([])

export type UseVFilesReturn = ReturnType<typeof useVFiles>

export const useVFiles = () => {
  const [
    vFiles, setVFiles
  ] = useAtom(vFilesAtom, { store: useStore() })
  const setVFile = useMemo(() => createSetVFile(setVFiles), [setVFiles])
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
