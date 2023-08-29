export function HeaderTitle() {
  return <>
    <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 37px;
"><span style="color: #fff;font-weight: bolder;text-align: justify;font-size: 22px;line-height: 10px;margin-top: 3px;">POWER</span><span style="color: color-mix(in srgb, var(--primary), #fff 80%);font-weight: 200;font-size: 16px;">Playground</span>
</div>
    
    {import.meta.env.MODE === 'development' && <span style={{
      marginTop: '-1em',
      color: 'color-mix(in srgb, var(--primary), #fff 80%)',
      fontWeight: 'bolder',
      fontSize: '0.5em'
    }}>&nbsp;(Dev)</span>}
  </>
}
