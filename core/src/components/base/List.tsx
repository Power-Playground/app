import { forwardRefWithStatic } from './forwardRefWithStatic'

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
    Hi
  </div>
})
Object.defineProperty(List, 'prefix', {
  value: 'ppd-list',
  writable: false
})
