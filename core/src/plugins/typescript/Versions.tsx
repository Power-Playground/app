import { useContext, useEffect, useMemo, useRef } from 'react'

import { typescriptVersionMeta, useDistTags } from '../../components/editor.typescript.versions.ts'
import { Popover } from '../../components/Popover.tsx'
import type { QuickAccess } from '../../components/QuickAccess.tsx'
import { QuickAccessContext } from '../../components/QuickAccess.tsx'
import { defineBarItem } from '../../plugins'

import type { TypeScriptPluginX } from './index.tsx'

export const Versions = defineBarItem<TypeScriptPluginX['ExtShareState']>(({ searchParams, shareState }) => {
  const [value, onChange] = [
    shareState.typescriptVersion ?? searchParams.get('typescript') ?? typescriptVersionMeta.versions[0],
    shareState.changeTypescriptVersion
  ]
  const {
    data, fetching, error
  } = useDistTags()
  const distTagsMemo = useMemo(() => {
    return (error !== null && !!data) ? data : null
  }, [data, error])
  const distTagEnumMemo = useMemo(() => {
    return distTagsMemo
      ? Object.fromEntries(
        Object.entries(distTagsMemo).flatMap(([key, value]) => [[key, value], [value, key]])
      )
      : typescriptVersionMeta.distTagEnum
  }, [distTagsMemo])
  const distCategoryMemo = useMemo(() => {
    return distTagsMemo
      ? Object.keys(distTagsMemo)
      : typescriptVersionMeta.distCategory
  }, [distTagsMemo])
  const isNeedCheckFetching = useMemo(() => {
    if (value === undefined) return false

    // 不在推荐的版本中，说明是 dist tags 模式
    return typescriptVersionMeta.suggestedVersions.indexOf(value) === -1
  }, [value])
  const realVersion = useMemo(() => {
    if (value === undefined) return undefined

    return isNeedCheckFetching
      ? distTagEnumMemo?.[value]
      : value
  }, [distTagEnumMemo, isNeedCheckFetching, value])
  const onlyOnce = useRef(false)
  useEffect(() => {
    if (realVersion !== undefined) {
      if (onlyOnce.current) {
        return
      }
      onlyOnce.current = true
      onChange?.(realVersion)
    }
  }, [onChange, realVersion])

  const quickAccess = useContext(QuickAccessContext)
  const suggestedVersions = useMemo(() => typescriptVersionMeta.suggestedVersions.map(version => {
    const displayVersion = (version === '3.3.3333'
      ? '3.3.3'
      : version === '3.3.4000'
        ? '3.3.4'
        : version)
      + (distTagEnumMemo[version] ? ` (${distTagEnumMemo[version]})` : '')
    return {
      id: version,
      title: displayVersion
    }
  }), [distTagEnumMemo])
  const taggedVersions = useMemo(() => distCategoryMemo
    .map(version => ({
      id: version,
      title: `${version} (${distTagEnumMemo[version]})`
    })), [distCategoryMemo, distTagEnumMemo])
  const versionsSelectCommandHandler = useMemo(() => {
    let handler: QuickAccess.CommandHandler
    if (fetching) {
      handler = () => [
        { id: 'fetching', title: 'Fetching...' }
      ]
    } else {
      handler = keywords => suggestedVersions
        .concat(taggedVersions)
        .filter(({ title }) => !keywords || title.includes(keywords))
    }
    handler.defaultId = value
    handler.options = {
      placeholder: 'Select TypeScript Version'
    }
    return handler
  }, [fetching, suggestedVersions, taggedVersions, value])
  useEffect(
    () => quickAccess.register('typescript.versions', versionsSelectCommandHandler),
    [quickAccess, versionsSelectCommandHandler]
  )
  return <Popover
    content={<>
      Monaco Editor is using TypeScript@{distTagEnumMemo[value] ?? value} as language service.(Click to change version)
    </>}
    style={{
      cursor: 'pointer',
      userSelect: 'none'
    }}
    offset={[0, 3]}
    onClick={async () => {
      try {
        const result = await quickAccess.run('typescript.versions')
        if ('id' in result) {
          const { id: version } = result
          onChange?.(isNeedCheckFetching
            ? distTagEnumMemo?.[version]
            : version)
        }
        if ('text' in result) {
          // TODO resolve this case
          console.log('text', result)
        }
      } catch (e) {
        console.error(e)
      }
    }}
    >
    TypeScript@{value}
  </Popover>
})
