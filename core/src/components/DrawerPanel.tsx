import './DrawerPanel.scss'

DrawerPanel.prefix = 'ppd-drawer-panel'
export function DrawerPanel() {
  const { prefix } = DrawerPanel

  return <div className={prefix}>
    <div className={`${prefix}__header`}>
      <div className={`${prefix}__header__title`}>
        <h3>
          <span className='cldr codicon codicon-project'></span>
          Project
        </h3>
      </div>
      <div className={`${prefix}__header__actions`}>
        <button>
          <span className='cldr codicon codicon-fold-up' style={{ transform: 'rotate(-90deg)' }} />
        </button>
        <button>
          <span className='cldr codicon codicon-more' />
        </button>
      </div>
    </div>
    <div className={`${prefix}__body`}>
    </div>
  </div>
}
