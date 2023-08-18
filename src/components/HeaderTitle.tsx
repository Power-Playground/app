import PP from '../../resources/PP_P.svg'

export function HeaderTitle() {
  return <>
    <img src={PP} width='24px' alt='Power Playground Icon' />
    &nbsp;
    <span style={{
      color: 'color-mix(in srgb, var(--primary), #fff 80%)',
      fontWeight: 'bolder'
    }}>P</span>ower
    &nbsp;
    <span style={{
      color: 'color-mix(in srgb, var(--primary), #fff 80%)',
      fontWeight: 'bolder'
    }}>P</span>layground
    {import.meta.env.MODE === 'development' && <span style={{
      marginTop: '-1em',
      color: 'color-mix(in srgb, var(--primary), #fff 80%)',
      fontWeight: 'bolder',
      fontSize: '0.5em'
    }}>&nbsp;(Dev)</span>}
  </>
}
