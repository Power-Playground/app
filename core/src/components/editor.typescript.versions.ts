import { useEffect, useMemo, useRef, useState } from 'react'

interface Versions {
  distCategory: string[]
  distTagEnum: Record<string, string>
  versions: string[]
  suggestedVersions: string[]
}

export const typescriptVersionMeta =
  // @ts-ignore
  TYPESCRIPT_VERSIONS_META as Versions

export const useDistTags = () => {
  const [reFetch, setReFetch] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<Record<string, string>>()
  const abortController = useMemo(() => new AbortController(), [])
  const effectOnlyOnceRef = useRef<boolean>(false)
  useEffect(() => {
    if (!effectOnlyOnceRef.current) {
      effectOnlyOnceRef.current = true
      return
    }
    if (!fetching) {
      setFetching(true)
      fetch('https://registry.npmmirror.com/-/package/typescript/dist-tags', {
        signal: abortController.signal
      })
        .then(res => res.json())
        .then(data => {
          setData(data)
          setError(null)
        })
        .catch(setError)
        .finally(() => setFetching(false))
    }
    return () => abortController.abort()
  }, [abortController, fetching, reFetch])
  return {
    data,
    fetching,
    error,
    reFetch: () => setReFetch(reFetch + 1)
  }
}
