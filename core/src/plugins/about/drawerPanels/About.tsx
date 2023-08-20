import { useImports } from '@power-playground/core'
import { useAtom } from 'jotai'

import { mdContentAtom } from '..'

export function About() {
  const {
    'third_party/marked/marked.js': { Marked: marked } = {}
  } = useImports(
    'third_party/marked/marked.js'
  ) as {
    'third_party/marked/marked.js'?: typeof import('//chii/third_party/marked/marked')
  }
  const [about] = useAtom(mdContentAtom)

  return <div
    style={{ padding: '4px' }}
    dangerouslySetInnerHTML={{
      __html: marked?.(about) ?? ''
    }}
  />
}
