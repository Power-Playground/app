import React, { useContext, useEffect, useMemo, useRef } from 'react'
import type { BarItemProps, QuickAccess } from '@power-playground/core'
import { messenger, QuickAccessContext } from '@power-playground/core'

import { Popover } from '../../components/base/Popover'

import type { TypeScriptPluginX } from '.'
import { typescriptVersionMeta, useDistTags } from './editor.typescript.versions'

export const Versions: React.ComponentType<BarItemProps<TypeScriptPluginX['ExtShareState']>> = (({ searchParams, shareState }) => {
  const queryVersion = searchParams.get('typescript')
    ?? searchParams.get('ts')
    ?? searchParams.get('tsv')
    ?? searchParams.get('tsv')

  const queryTag = searchParams.get('tag')
    ?? searchParams.get('dist-tag')
    ?? searchParams.get('distTag')
    ?? searchParams.get('dist_tag')
    ?? queryVersion

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

  // ?typescript=a.b.c
  // ?typescript=a.b.c&tag=beta
  // ?tag=beta
  // ?typescript=beta
  const value = useMemo(() => shareState.typescriptVersion
  ?? (queryVersion !== null && typescriptVersionMeta.suggestedVersions.includes(queryVersion)
    ? queryVersion
    : queryTag
      ? distTagEnumMemo[queryTag]
      : typescriptVersionMeta.versions[0]
  ), [
    distTagEnumMemo, queryTag, queryVersion, shareState.typescriptVersion
  ])
  const onChange = shareState.changeTypescriptVersion

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
      value: distTagEnumMemo[version] ?? version,
      title: displayVersion
    }
  }), [distTagEnumMemo])
  const taggedVersions = useMemo(() => distCategoryMemo
    .map(version => ({
      id: version,
      value: distTagEnumMemo[version] ?? version,
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
    handler.defaultId = typescriptVersionMeta.suggestedVersions.includes(value)
      ? value
      : distTagEnumMemo[value] ?? value
    handler.options = {
      placeholder: 'Select TypeScript Version'
    }
    return handler
  }, [distTagEnumMemo, fetching, suggestedVersions, taggedVersions, value])
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
          result.value
            ? onChange?.(result.value.toString())
            : messenger.then(m => m.display('error', <>
              <h3>Invalid TypeScript Version</h3>
              <p>Version <code>{result.id}</code> is not available.</p>
              {/* TODO support help jump */}
              <p>Click <a href='/TODO'>it</a> and find help.</p>
            </>))
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
