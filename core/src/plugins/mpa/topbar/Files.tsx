import './Files.scss'

import type { BarItemProps } from '../..'

const prefix = 'mpa__topbar__files'

export const Files: React.ComponentType<BarItemProps> = () => {
  return <div className={prefix}>
    <div className={`${prefix}-tab active`}>
      <span className='cldr codicon codicon-file' />
      index.ts
      <span className='cldr codicon codicon-close' />
    </div>
    <div className={`${prefix}-tab`}>
      <span className='cldr codicon codicon-file' />
      index.spec.ts
      <span className='cldr codicon codicon-close' />
    </div>
    <div className={`${prefix}-full`} />
  </div>
}
