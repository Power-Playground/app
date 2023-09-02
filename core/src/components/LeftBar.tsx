import './LeftBar.scss'

import { classnames, messenger } from '@power-playground/core'

import PP from '../../../resources/PP_P.svg'

const prefix = 'ppd-left-bar'

export interface LeftBarProps {
  style?: React.CSSProperties
  className?: string
}

export function LeftBar(props: LeftBarProps) {
  return <div className={classnames(prefix, props.className)}
              style={props.style}>
    <div className={`${prefix}__top`}>
      <button onClick={() => messenger.then(m => m.display('warning', <>Not implemented yet, it will come soon, <a href='https://github.com/Power-Playground/app/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22' target='_blank' rel='noreferrer'>help us</a></>))}>
        <span className='cldr codicon codicon-folder'></span>
        {/* TODO multiple files plugin */}
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <>Not implemented yet, it will come soon, <a href='https://github.com/Power-Playground/app/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22' target='_blank' rel='noreferrer'>help us</a></>))}>
        <span className='cldr codicon codicon-heart'></span>
        {/* TODO snippets */}
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <>Not implemented yet, it will come soon, <a href='https://github.com/Power-Playground/app/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22' target='_blank' rel='noreferrer'>help us</a></>))}>
        <span className='cldr codicon codicon-source-control'></span>
        {/* TODO code timeline */}
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <>Not implemented yet, it will come soon, <a href='https://github.com/Power-Playground/app/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22' target='_blank' rel='noreferrer'>help us</a></>))}>
        <span className='cldr codicon codicon-book'></span>
        {/* TODO examples and documents */}
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <>Not implemented yet, it will come soon, <a href='https://github.com/Power-Playground/app/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22' target='_blank' rel='noreferrer'>help us</a></>))}>
        <span className='cldr codicon codicon-extensions'></span>
        {/* TODO extensions marketplace */}
      </button>
    </div>
    <div className={`${prefix}__bottom`}>
      <button onClick={() => messenger.then(m => m.display('warning', <>Not implemented yet, it will come soon, <a href='https://github.com/Power-Playground/app/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22' target='_blank' rel='noreferrer'>help us</a></>))}>
        <span className='cldr codicon codicon-account'></span>
      </button>
      <button onClick={() => messenger.then(m => m.display('warning', <>Not implemented yet, it will come soon, <a href='https://github.com/Power-Playground/app/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22' target='_blank' rel='noreferrer'>help us</a></>))}>
        <span className='cldr codicon codicon-gear'></span>
      </button>
      <img src={PP} alt='Power Playground menu icon.' />
    </div>
  </div>
}
