import './List.scss'

import { useRef, useState } from 'react'

import { classnames } from '../../utils'

import { forwardRefWithStatic } from './forwardRefWithStatic'

export interface ListItem {
  icon?: string | React.ReactNode
  id: string
  label: string
  content?: React.ReactNode | ((keyword: string, item: ListItem) => React.ReactNode)
  placeholder?: string | React.ReactNode

  disabled?: boolean
}
export interface ListProps {
  selectable?: boolean
}
export interface ListRef {
}

export const List = forwardRefWithStatic<{
  readonly prefix: 'ppd-list'
}, ListRef, ListProps>((props, ref) => {
  const {
    selectable = false
  } = props
  const { prefix } = List

  const itemsRef = useRef<HTMLDivElement[]>([])
  const [keyword, setKeyword] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const items: ListItem[] = [
    { icon: 'file',
      id: 'index.ts',
      label: 'index.ts',
      placeholder: '[entry]' },
    { icon: 'beaker',
      id: 'index.spec.ts',
      label: 'index.spec.ts' },
    { icon: 'file',
      id: 'tsconfig.json',
      label: 'tsconfig.json' },
    { icon: 'file',
      id: 'item-3',
      label: 'Item 3' },
    { icon: 'folder-library',
      id: 'node_modules',
      label: 'node_modules' },
    { icon: 'folder-library',
      id: 'node_modules0',
      label: 'node_modules' },
    { icon: 'folder-library',
      id: 'node_modules1',
      label: 'node_modules' },
    { icon: 'folder-library',
      id: 'node_modules2',
      label: 'node_modules' }
  ]
  return <div
    className={prefix}
    onClick={() => setSelectedIds([])}
    >
    {items.map((item, index) => <div
      ref={el => el && (itemsRef.current[index] = el)}
      key={item.id}
      tabIndex={item.disabled ? undefined : 0}
      onClick={e => {
        e.stopPropagation()
        if (!selectable || item.disabled) return

        const withCtrlOrMeta = e.ctrlKey || e.metaKey
        const withShift = e.shiftKey

        setSelectedIds(selectedIds => {
          if (!withCtrlOrMeta && !withShift) {
            return [item.id]
          }

          const findIndex = selectedIds.indexOf(item.id)
          if (withCtrlOrMeta) {
            if (findIndex === -1) {
              return [...selectedIds, item.id]
            } else {
              setTimeout(() => itemsRef.current[index].blur(), 10)
              return [...selectedIds.slice(0, findIndex), ...selectedIds.slice(findIndex + 1)]
            }
          }

          if (findIndex !== -1) {
            setTimeout(() => itemsRef.current[index].blur(), 10)
            return selectedIds
              .filter(id => id !== item.id)
          }

          let prevSelectedIndex = index
          let nextSelectedIndex = index
          let prevIndexIsSelected = false
          let nextIndexIsSelected = false
          do {
            // TODO select prev/next by prev step select item index
            if (!prevIndexIsSelected && prevSelectedIndex - 1 >= 0) {
              const temp = selectedIds.includes(items[prevSelectedIndex - 1].id)
              if (!temp) {
                prevSelectedIndex--
              } else {
                prevIndexIsSelected = temp
                break
              }
            }
            if (!nextIndexIsSelected && nextSelectedIndex + 1 < items.length) {
              const temp = selectedIds.includes(items[nextSelectedIndex + 1].id)
              if (!temp) {
                nextSelectedIndex++
              } else {
                nextIndexIsSelected = temp
                break
              }
            }
          } while (
            (
              prevSelectedIndex - 1 >= 0
            ) || (
              nextSelectedIndex + 1 < items.length
            )
          )
          const range = [index, index]
          if (prevIndexIsSelected && prevSelectedIndex >= 0) {
            range[0] = prevSelectedIndex
          }
          if (nextIndexIsSelected && nextSelectedIndex < items.length) {
            range[1] = nextSelectedIndex
          }
          const rangeIds = []
          for (let i = range[0]; i <= range[1]; i++) {
            rangeIds.push(items[i].id)
          }
          return selectedIds.concat(rangeIds.filter(id => !selectedIds.includes(id)))
        })
      }}
      className={classnames(
        `${prefix}-item`,
        selectable && !item.disabled && 'clickable',
        item.disabled && 'disabled',
        selectedIds.includes(item.id) && 'selected'
      )}
      >
      {item.icon && typeof item.icon === 'string'
        ? <span className={`${prefix}-item__icon cldr codicon codicon-${item.icon}`} />
        : item.icon}
      {item.content
        ? typeof item.content === 'function'
          ? item.content(keyword, item)
          : item.content
        : <code className={`${prefix}-item__label`}>{item.label}</code>}
      {item.placeholder && typeof item.placeholder === 'string'
        ? <code className={`${prefix}-item__placeholder`}>{item.placeholder}</code>
        : item.placeholder}
    </div>)}
  </div>
})
Object.defineProperty(List, 'prefix', {
  value: 'ppd-list',
  writable: false
})
