import './List.scss'

import { forwardRefWithStatic } from './forwardRefWithStatic'

export interface ListItem {
  icon?: string | React.ReactNode
  label: string | React.ReactNode
  placeholder?: string | React.ReactNode
}
export interface ListProps {
}
export interface ListRef {
}

export const List = forwardRefWithStatic<{
  readonly prefix: 'ppd-list'
}, ListProps, ListRef>((props, ref) => {
  const { prefix } = List

  console.log('List', props, ref)
  return <div className={prefix}>
    <div tabIndex={0} className={`${prefix}-item clickable selected`}>
      <span className={`${prefix}-item__icon cldr codicon codicon-chevron-right`} />
      <code className={`${prefix}-item__label`}>Item 0</code>
      <code className={`${prefix}-item__placeholder`}>Placehold------------------------------------------er</code>
    </div>
    <div tabIndex={0} className={`${prefix}-item clickable`}>
      <span className={`${prefix}-item__icon cldr codicon codicon-beaker`} />
      <code className={`${prefix}-item__label`}>Item 1</code>
      <code className={`${prefix}-item__placeholder`}>Placehold------------------------------------------er</code>
    </div>
    <div tabIndex={0} className={`${prefix}-item clickable`}>
      <span className={`${prefix}-item__icon cldr codicon codicon-file`} />
      <code className={`${prefix}-item__label`}>Item 2</code>
    </div>
    <div tabIndex={0} className={`${prefix}-item clickable active selected`}>
      <span className={`${prefix}-item__icon cldr codicon codicon-file`} />
      <code className={`${prefix}-item__label`}>Item 3</code>
    </div>
    <div className={`${prefix}-item`}>
      <span className={`${prefix}-item__icon cldr codicon codicon-file-media`} />
      <code className={`${prefix}-item__label`}>Item 4</code>
    </div>
  </div>
})
Object.defineProperty(List, 'prefix', {
  value: 'ppd-list',
  writable: false
})
