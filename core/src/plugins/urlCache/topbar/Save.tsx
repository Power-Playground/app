import './Save.scss'

import React, { useContext, useMemo } from 'react'
import { useAtom } from 'jotai'

import { Popover } from '../../../components/base/Popover'
import { MonacoScopeContext } from '../../../contextes/MonacoScope'
import { classnames, isMacOS } from '../../../utils'
import type { BarItemProps } from '../..'
import { saveStatusAtom } from '../atoms'

const prefix = 'url-cache__topbar__save'

export const Save: React.ComponentType<BarItemProps> = () => {
  const { editorInstance } = useContext(MonacoScopeContext) ?? {}
  const model = useMemo(() => editorInstance?.getModel(), [editorInstance])
  const [saveStatus] = useAtom(saveStatusAtom)
  const curSaveStatus = useMemo(() => {
    if (!model) return 'disabled'
    const uri = model.uri.toString()
    const s = saveStatus?.[uri]
    return s === true
      ? 'saved'
      : s === false
        ? 'save-needed'
        : 'disabled'
  }, [model, saveStatus])

  return <Popover
    style={{ order: -100 }}
    placement='top'
    content={<>
      Save
      &nbsp;&nbsp;
      <kbd>{isMacOS ? '⌘' : 'Ctrl'} + S</kbd>
    </>}
    offset={[0, 6]}
    >
    <button
      className={classnames(
        prefix, curSaveStatus
      )}
      onClick={() => editorInstance?.trigger('whatever', 'ppd.save', {})}>
      <div className='cldr codicon codicon-save' />
      <span className={`${prefix}-status`} />
    </button>
  </Popover>
}
