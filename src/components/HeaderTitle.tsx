import './HeaderTitle.scss'

export function HeaderTitle() {
  return <>
    <div className='logo'>
      &nbsp;
      <span className='highlight'>P</span>
      <span className='secondary'>ower</span>
      &nbsp;
      <span className='highlight'>P</span>
      <span className='secondary'>layground</span>
    </div>
    {import.meta.env.MODE === 'development' && <span style={{
      marginTop: '-1em',
      color: 'color-mix(in srgb, var(--primary), #fff 80%)',
      fontWeight: 'bolder',
      fontSize: '0.5em'
    }}>&nbsp;(Dev)</span>}
  </>
}
