import s from './HeatMaster.module.css'

export default function HeatMaster({ heatMaster }) {
  const keys = Object.keys(heatMaster)

  if (keys.length === 0) {
    return (
      <div className={s.wrap}>
        <div className={s.empty}>
          <p>No heats saved yet</p>
          <p className={s.emptyHint}>Use Intake Mode to upload and extract documents</p>
        </div>
      </div>
    )
  }

  return (
    <div className={s.wrap}>
      <div className={s.topBar}>
        <h2 className={s.title}>HEAT MASTER — {keys.length} RECORD{keys.length !== 1 ? 'S' : ''}</h2>
        <span className={s.note}>Demo version — data resets on page refresh</span>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              {['Cert #','Heat #','Grade','Mill','Dia','C','Mn','Si','P','S',
                'Tensile','Yield','Elong%','Status','Saved'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(k => {
              const h = heatMaster[k]
              const chem = h.chemistry || {}
              const mech = h.mechanicals || {}
              const failing = (mech.tensile && parseFloat(mech.tensile) < 49000) ||
                              (mech.elongation && parseFloat(mech.elongation) < 28)
              return (
                <tr key={k} className={failing ? s.failRow : ''}>
                  <td className={s.certCell}>{h.certNumber || '—'}</td>
                  <td className={s.heatCell}>{k}</td>
                  <td>{h.grade || '—'}</td>
                  <td>{h.millName || '—'}</td>
                  <td>{h.diameter || '—'}</td>
                  <td>{chem.c  || '—'}</td>
                  <td>{chem.mn || '—'}</td>
                  <td>{chem.si || '—'}</td>
                  <td>{chem.p  || '—'}</td>
                  <td>{chem.s  || '—'}</td>
                  <td className={failing ? s.failCell : s.passCell}>{mech.tensile    || '—'}</td>
                  <td>{mech.yield      || '—'}</td>
                  <td className={mech.elongation && parseFloat(mech.elongation) < 28 ? s.failCell : ''}>{mech.elongation || '—'}</td>
                  <td className={failing ? s.holdCell : s.completeCell}>{failing ? 'HOLD' : h.status}</td>
                  <td className={s.savedCell}>{h.savedAt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
