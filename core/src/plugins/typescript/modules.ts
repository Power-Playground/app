import { getDTName } from './utils'

export const moduleLoadingStateSymbol = Symbol('moduleLoadingState')
export const moduleLoadErrorSymbol = Symbol('moduleLoadError')
export const metaSymbol = Symbol('meta')

type ModuleMeta = {
  main?: string
  module?: string
  browser?: string
  typings?: string
  types?: string
  exports?: Record<string, string | Partial<
    { import: string; require: string; browser: string; node: string; default: string; types: string; typings: string }
  >>
  dependencies?: Record<string, string>
}

type ModuleCacheItem =
| {
  [moduleLoadingStateSymbol]: 'loading'
}
| {
  [moduleLoadingStateSymbol]: 'loaded'
  [metaSymbol]: ModuleMeta
  [filePath: string]: string
}
| {
  [moduleLoadingStateSymbol]: 'error'
  [moduleLoadErrorSymbol]: string
}

const moduleCache = new Map<string, { [version: string]: ModuleCacheItem }>()
const cachedMap = new Map<string, boolean>()

export async function getModule(
  module: string, version: string,
  opts: {
    ext?: string[]
    forceReload?: boolean
  } = {
    forceReload: false
  }
) {
  if (!moduleCache.has(module)) {
    moduleCache.set(module, {})
  }
  const moduleCacheVersion = moduleCache.get(module)!
  try {
    version = (await NPM.calcVersion(module, version)).version!
  } catch (e) {
    console.error(e)
    moduleCacheVersion[version] = {
      [moduleLoadingStateSymbol]: 'error',
      [moduleLoadErrorSymbol]: `Version ${version} of module ${module} does not exist`
    }
  }
  const uniqKey = `${module}@${version}[${opts.ext?.join(',')}]`
  if (
    cachedMap.get(uniqKey) !== true
    || opts.forceReload
  ) {
    moduleCacheVersion[version] = { [moduleLoadingStateSymbol]: 'loading' }
    try {
      const tree = await NPM.getFileTree(module, version)
      const files = await Promise.all(
        tree.files
          .filter(({ name }) => {
            if (name === '/package.json') return true
            return opts.ext?.some(ext => name.endsWith(ext)) ?? true
          })
          .map(async ({ name }) => ({
            name,
            content: await NPM.getFileContent(tree.moduleName, tree.version, name)
          }))
      )
      const moduleCacheVersion = moduleCache.get(module)!
      const pkgJSON = JSON.parse(files.find(({ name }) => name === '/package.json')?.content ?? '{}')
      moduleCacheVersion[version] = {
        [moduleLoadingStateSymbol]: 'loaded',
        [metaSymbol]: pkgJSON,
        ...Object.fromEntries(files.map(({ name, content }) => [name, content]))
      }
    } catch (e) {
      if (e instanceof Error) {
        moduleCacheVersion[version] = {
          [moduleLoadingStateSymbol]: 'error',
          [moduleLoadErrorSymbol]: e.message
        }
      } else {
        throw e
      }
    }
    cachedMap.set(uniqKey, true)
  }
  const moduleCacheVersionEntry = moduleCacheVersion[version]
  if (moduleCacheVersionEntry[moduleLoadingStateSymbol] === 'loaded') {
    return moduleCacheVersionEntry
  } else if (moduleCacheVersionEntry[moduleLoadingStateSymbol] === 'error') {
    throw new Error(moduleCacheVersionEntry[moduleLoadErrorSymbol])
  } else {
    throw new Error(`Module ${module}@${version} is not loaded yet`)
  }
}

export function isDTSModule(meta: ModuleMeta) {
  const {
    typings,
    types,
    exports
  } = meta
  return (
    typings?.endsWith('.d.ts')
    || types?.endsWith('.d.ts')
    || Object.entries(exports ?? {}).some(([, value]) => {
      if (typeof value === 'string') {
        return value.endsWith('.d.ts')
      } else {
        return (
          value.types?.endsWith('.d.ts')
          || value.typings?.endsWith('.d.ts')
        )
      }
    })
  )
}

export async function resolveDep(module: string, version: string): Promise<{
  [module: string]: ModuleCacheItem
}> {
  let m = await getModule(module, version, { ext: ['.d.ts'] })
  const modules = { [module]: m }
  const meta = m[metaSymbol]
  let dtsMeta = { } as ModuleMeta
  if (!isDTSModule(meta)) {
    try {
      const dtsMName = `@types/${getDTName(module)}`
      m = await getModule(dtsMName, version, { ext: ['.d.ts'] })
      modules[dtsMName] = m
      dtsMeta = m[metaSymbol]
    } catch (e) {
      console.error(`Failed to load type for ${module}@${version} and @types/${getDTName(module)}@${version}`, e)
    }
  }
  const deps = Object.assign(meta.dependencies ?? {}, dtsMeta.dependencies ?? {})
  if (deps) {
    for (const [module, version] of Object.entries(deps)) {
      Object.assign(modules, await resolveDep(module, version))
    }
  }
  return modules
}

export const depLoadErrorSymbol = Symbol('depLoadError')

export async function resolveDeps(deps: [module: string, version: string][]) {
  return (
    await Promise
      .allSettled(deps.map(([module, version]) => resolveDep(module, version)))
  ).reduce((acc, result, currentIndex) => {
    const [module, version] = deps[currentIndex]
    if (result.status === 'rejected') {
      console.error(`Failed to load ${module}@${version}\n`, result.reason)
      acc[`${module}@${version}`] = {
        [depLoadErrorSymbol]: result.reason.message
      }
    } else {
      acc[`${module}@${version}`] = result.value
    }
    return acc
  }, {} as {
    [dependencyNameWithVersion: string]: {
      [depLoadErrorSymbol]?: string
      [module: string]: ModuleCacheItem
    }
  })
}

async function fj<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (res.ok) {
    return await res.json() as T
  } else {
    throw new Error(`Failed to load ${url}`)
  }
}

export namespace NPM {
  export const getTagsAndVersions = (moduleName: string) => fj<{ tags: Record<string, string>; versions: string[] }>(
    `https://data.jsdelivr.com/v1/package/npm/${moduleName}`,
    { cache: 'no-store' }
  )
  export const calcVersion = (moduleName: string, reference: string) => fj<{ version: string | null }>(
    `https://data.jsdelivr.com/v1/package/resolve/npm/${moduleName}@${reference}`
  )
  export type TreeMeta = { default: string; files: { name: string }[]; moduleName: string; version: string }
  export const getFileTree = async (moduleName: string, version: string) => ({
    ...await fj<TreeMeta>(`https://data.jsdelivr.com/v1/package/npm/${moduleName}@${version}/flat`),
    moduleName,
    version
  })
  export const getFileContent = async (
    moduleName: string, version: string, file: string
  ) => {
    const url = `https://cdn.jsdelivr.net/npm/${moduleName}@${version}${file}`
    const res = await fetch(url)
    if (res.ok) {
      return res.text()
    } else {
      throw new Error(`Failed to load file ${file} from ${moduleName}@${version}`)
    }
  }
}
