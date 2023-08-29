export function HeaderTitle() {
  return <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: 37
        }}
      >
        <span
          style={{
            color: "#fff",
            fontWeight: "bolder",
            textAlign: "justify",
            fontSize: 22,
            lineHeight: 10,
            marginTop: 3
          }}
        >
          POWER
        </span>
        <span
          style={{
            color: "color-mix(in srgb, var(--primary), #fff 80%)",
            fontWeight: 300,
            fontSize: 16
          }}
        >
          Playground
        </span>
      </div>

    
    {import.meta.env.MODE === 'development' && <span style={{
      marginTop: '-1em',
      color: 'color-mix(in srgb, var(--primary), #fff 80%)',
      fontWeight: 'bolder',
      fontSize: '0.5em'
    }}>&nbsp;(Dev)</span>}
  </>
}
