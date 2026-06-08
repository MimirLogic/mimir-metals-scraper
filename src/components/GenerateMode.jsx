import { useState } from 'react'
import s from './GenerateMode.module.css'

const SPEC_LIMITS = {
  c:  { min: 0.08, max: 0.13 }, mn: { min: 0.30, max: 0.60 },
  si: { min: 0.10, max: 0.25 }, p:  { max: 0.030 },
  s:  { max: 0.050 },           al: { min: 0.015, max: 0.050 },
}

function checkSpec(element, value) {
  const lim = SPEC_LIMITS[element]
  if (!lim || !value) return 'ok'
  const v = parseFloat(value)
  if (isNaN(v)) return 'ok'
  if (lim.min !== undefined && v < lim.min) return 'fail'
  if (lim.max !== undefined && v > lim.max) return 'fail'
  return 'pass'
}

function checkMechanicals(mech) {
  const issues = []
  if (mech.tensile && parseFloat(mech.tensile) < 49000) issues.push('Tensile below 49,000 PSI minimum')
  if (mech.yield   && parseFloat(mech.yield)   < 41000) issues.push('Yield below 41,000 PSI minimum')
  if (mech.elongation && parseFloat(mech.elongation) < 28) issues.push('Elongation below 28% minimum')
  if (mech.reduction  && parseFloat(mech.reduction)  < 55) issues.push('Reduction of Area below 55% minimum')
  return issues
}

export default function GenerateMode({ heatMaster }) {
  const [selectedHeat, setSelectedHeat] = useState('')
  const [customer, setCustomer] = useState({
    name: '', po: '', invoice: '', partNumber: '', partDesc: '', quantity: ''
  })
  const [cert, setCert] = useState(null)
  const [astm, setAstm] = useState({
    a29: false, a108: false, a276: false, a320: false, a496: false, a1044: false
  })

  const heatKeys = Object.keys(heatMaster)

  const generate = () => {
    if (!selectedHeat || !customer.name) return
    const heat = heatMaster[selectedHeat]
    const certNum = heat.certNumber || `MM-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-001`
    const mechIssues = checkMechanicals(heat.mechanicals || {})
    setCert({ heat, customer, astm, certNum, generatedAt: new Date().toLocaleDateString(), mechIssues })
  }

  const handlePrint = () => window.print()

  const heat = selectedHeat ? heatMaster[selectedHeat] : null

  return (
    <div className={s.wrap}>
      <div className={s.grid}>
        {/* LEFT — Controls */}
        <div>
          <h2 className={s.sectionTitle}>01 — SELECT HEAT</h2>

          {heatKeys.length === 0 ? (
            <div className={s.noHeats}>No heats in master — use Intake Mode to add heats first</div>
          ) : (
            <>
              <div className={s.field}>
                <label className={s.label}>HEAT NUMBER</label>
                <select className={s.select} value={selectedHeat} onChange={e => setSelectedHeat(e.target.value)}>
                  <option value="">-- Select a heat --</option>
                  {heatKeys.map(k => (
                    <option key={k} value={k}>{k} — {heatMaster[k].grade || 'No grade'}</option>
                  ))}
                </select>
              </div>

              {heat && (
                <div className={s.heatPreview}>
                  <div className={s.heatRow}><span className={s.heatLabel}>GRADE:</span><span>{heat.grade || '—'}</span></div>
                  <div className={s.heatRow}><span className={s.heatLabel}>MILL:</span><span>{heat.millName || '—'}</span></div>
                  <div className={s.heatRow}><span className={s.heatLabel}>DIAMETER:</span><span>{heat.diameter || '—'}</span></div>
                  <div className={s.heatRow}><span className={s.heatLabel}>SAVED:</span><span>{heat.savedAt}</span></div>
                  {checkMechanicals(heat.mechanicals || {}).length > 0 && (
                    <div className={s.failWarn}>
                      ⚠ MECHANICAL FAILURES DETECTED — REVIEW BEFORE CERTIFYING
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <h2 className={s.sectionTitle} style={{ marginTop: 18 }}>02 — CUSTOMER ORDER</h2>

          {[
            ['name',       'CUSTOMER NAME *'],
            ['po',         'PO NUMBER'],
            ['invoice',    'INVOICE NUMBER'],
            ['partNumber', 'PART NUMBER'],
            ['partDesc',   'PART DESCRIPTION'],
            ['quantity',   'QUANTITY'],
          ].map(([k, label]) => (
            <div key={k} className={s.field} style={{ marginBottom: 8 }}>
              <label className={s.label}>{label}</label>
              <input
                className={s.input}
                value={customer[k]}
                onChange={e => setCustomer(p => ({ ...p, [k]: e.target.value }))}
                placeholder={k === 'name' ? 'Required' : ''}
              />
            </div>
          ))}

          <h2 className={s.sectionTitle} style={{ marginTop: 18 }}>03 — SPECIFICATIONS</h2>
          <div className={s.specsGrid}>
            {Object.entries(astm).map(([k, v]) => (
              <label key={k} className={s.checkLabel}>
                <input type="checkbox" checked={v} onChange={e => setAstm(p => ({ ...p, [k]: e.target.checked }))} />
                <span>ASTM {k.toUpperCase()}</span>
              </label>
            ))}
          </div>

          <button
            className={s.genBtn}
            onClick={generate}
            disabled={!selectedHeat || !customer.name}
          >
            GENERATE CERTIFICATE PREVIEW
          </button>
        </div>

        {/* RIGHT — Preview */}
        <div>
          <h2 className={s.sectionTitle}>04 — PREVIEW & PRINT</h2>

          {cert ? (
            <>
              <div id="cert-print-zone">
                <div className={s.certPage}>
                  {/* Cert Header */}
                  <div className={s.certHeader}>
                    <div>
                      <h1 className={s.certTitle}>CERTIFICATE OF COMPLIANCE</h1>
                      <p className={s.certCompany}>Mimir Metals — Warren, Michigan</p>
                    </div>
                    <div className={s.certMeta}>
                      <p><strong>Cert No:</strong> {cert.certNum}</p>
                      <p><strong>Date:</strong> {cert.generatedAt}</p>
                    </div>
                  </div>

                  {/* Fail banner */}
                  {cert.mechIssues.length > 0 && (
                    <div className={s.certFailBanner}>
                      ⚠ MATERIAL ON HOLD — {cert.mechIssues.join(' | ')}
                    </div>
                  )}

                  {/* Customer */}
                  <div className={s.certSection}>
                    <p className={s.certSectionTitle}>CUSTOMER & ORDER INFORMATION</p>
                    <div className={s.certGrid2}>
                      <div><span className={s.certLbl}>Customer:</span> {cert.customer.name}</div>
                      <div><span className={s.certLbl}>PO #:</span> {cert.customer.po || '—'}</div>
                      <div><span className={s.certLbl}>Invoice #:</span> {cert.customer.invoice || '—'}</div>
                      <div><span className={s.certLbl}>Part #:</span> {cert.customer.partNumber || '—'}</div>
                      <div><span className={s.certLbl}>Description:</span> {cert.customer.partDesc || '—'}</div>
                      <div><span className={s.certLbl}>Quantity:</span> {cert.customer.quantity || '—'}</div>
                      <div><span className={s.certLbl}>Heat #:</span> <strong>{cert.heat.heatNumber}</strong></div>
                      <div><span className={s.certLbl}>Grade:</span> {cert.heat.grade || '—'}</div>
                      <div><span className={s.certLbl}>Mill:</span> {cert.heat.millName || '—'}</div>
                      <div><span className={s.certLbl}>Diameter:</span> {cert.heat.diameter || '—'}</div>
                    </div>
                  </div>

                  {/* Chemistry */}
                  <div className={s.certSection}>
                    <p className={s.certSectionTitle}>CHEMICAL ANALYSIS (%)</p>
                    <table className={s.certTable}>
                      <thead>
                        <tr>{Object.keys(cert.heat.chemistry || {}).map(k => <th key={k}>{k.toUpperCase()}</th>)}</tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Object.entries(cert.heat.chemistry || {}).map(([k, v]) => {
                            const result = checkSpec(k, v)
                            return (
                              <td key={k} style={{ color: result === 'fail' ? '#f44336' : result === 'pass' ? '#4caf50' : 'inherit' }}>
                                {v || '—'}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mechanicals */}
                  <div className={s.certSection}>
                    <p className={s.certSectionTitle}>MECHANICAL PROPERTIES</p>
                    <table className={s.certTable}>
                      <thead>
                        <tr>
                          <th>TENSILE (PSI)</th><th>YIELD (PSI)</th>
                          <th>ELONGATION %</th><th>REDUCTION %</th><th>HARDNESS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {['tensile','yield','elongation','reduction','hardness'].map(k => {
                            const v = cert.heat.mechanicals?.[k] || '—'
                            const fail = (k === 'tensile' && parseFloat(v) < 49000) ||
                                         (k === 'yield'   && parseFloat(v) < 41000) ||
                                         (k === 'elongation' && parseFloat(v) < 28)  ||
                                         (k === 'reduction'  && parseFloat(v) < 55)
                            return <td key={k} style={{ color: fail ? '#f44336' : '#2d7a2d', fontWeight: 'bold' }}>{v}</td>
                          })}
                        </tr>
                        <tr className={s.specRow}>
                          <td>49,000 MIN</td><td>41,000 MIN</td>
                          <td>28% MIN</td><td>55% MIN</td><td>60-90 HRB</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Specs */}
                  {Object.values(cert.astm).some(Boolean) && (
                    <div className={s.certSection}>
                      <p className={s.certSectionTitle}>APPLICABLE SPECIFICATIONS</p>
                      <p className={s.certSpecLine}>
                        {Object.entries(cert.astm).filter(([,v]) => v).map(([k]) => `ASTM ${k.toUpperCase()}`).join(' | ')}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className={s.certFooter}>
                    <p>Mimir Metals certifies the material above meets all applicable specification requirements. Final decisions remain with authorized quality personnel.</p>
                    <div className={s.certSigLine}>
                      Quality Manager: _________________________ &nbsp;&nbsp; Date: _____________
                    </div>
                    <p className={s.certPowered}>Powered by Mimir Logic AI — mimirlogic.netlify.app</p>
                  </div>
                </div>
              </div>

              <button className={s.printBtn} onClick={handlePrint}>
                🖨 PRINT / SAVE AS PDF
              </button>
            </>
          ) : (
            <div className={s.emptyState}>
              <p>Select a heat and customer info</p>
              <p className={s.emptyHint}>Certificate preview will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
