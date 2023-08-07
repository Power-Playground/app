import { useContext, useEffect, useMemo } from 'react'
import type { QuickAccess } from '@power-playground/core'
import { QuickAccessContext } from '@power-playground/core'

import { typescriptVersionMeta, useDistTags } from '../editor.typescript.versions.ts'
import { Popover } from '../Popover.tsx'

export function TypescriptVersionStatus({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
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
    // 不在推荐的版本中，说明是 dist tags 模式
    return typescriptVersionMeta.suggestedVersions.indexOf(value) === -1
  }, [value])

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
          onChange(isNeedCheckFetching
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
}
