import { useState, useRef, useCallback } from 'react'
import { extractDocuments } from '../gemini.js'
import s from './IntakeMode.module.css'

const EMPTY = {
  heatNumber: '', grade: '', millName: '', country: '',
  diameter: '', lotNumber: '', coilNumber: '', shipDate: '',
  chemistry: { c:'', mn:'', si:'', p:'', s:'', cr:'', ni:'', mo:'', cu:'', v:'', nb:'', al:'' },
  mechanicals: { tensile:'', yield:'', elongation:'', reduction:'', hardness:'' },
  orderInfo: { customer:'', poNumber:'', invoiceNumber:'', partNumber:'', quantity:'' },
}

export default function IntakeMode({ onSave }) {
  const [files, setFiles]       = useState([])
  const [drag, setDrag]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [docTypes, setDocTypes] = useState([])
  const [status, setStatus]     = useState(null)
  const [apiKey, setApiKey]     = useState(import.meta.env.VITE_GEMINI_KEY || '')
  const [showKey, setShowKey]   = useState(!import.meta.env.VITE_GEMINI_KEY)
  const inputRef = useRef()

  const addFiles = fs => {
    const pdfs = Array.from(fs).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))]
    })
  }

  const removeFile = i => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const extract = useCallback(async () => {
    if (!files.length) return
    if (!apiKey) { setStatus({ type: 'error', msg: 'Enter your Gemini API key above first' }); return }

    // Temporarily inject key for this session
    if (!import.meta.env.VITE_GEMINI_KEY) {
      window.__GEMINI_KEY__ = apiKey
    }

    setLoading(true)
    setStatus({ type: 'info', msg: `Sending ${files.length} document${files.length > 1 ? 's' : ''} to Gemini AI...` })
    try {
      const data = await extractDocuments(files, apiKey)
      const merged = {
        ...EMPTY,
        ...data,
        chemistry:   { ...EMPTY.chemistry,   ...(data.chemistry   || {}) },
        mechanicals: { ...EMPTY.mechanicals, ...(data.mechanicals || {}) },
        orderInfo:   { ...EMPTY.orderInfo,   ...(data.orderInfo   || {}) },
      }
      // Null → empty string
      const clean = JSON.parse(JSON.stringify(merged, (_, v) => v === null ? '' : v))
      setExtracted(clean)
      setWarnings(data.warnings || [])
      setDocTypes(data.docTypes || [])
      setStatus({ type: 'success', msg: 'Extraction complete — verify all fields before saving' })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    }
    setLoading(false)
  }, [files, apiKey])

  const update = (path, val) => {
    setExtracted(prev => {
      if (path.length === 1) return { ...prev, [path[0]]: val }
      return { ...prev, [path[0]]: { ...prev[path[0]], [path[1]]: val } }
    })
  }

  const save = () => {
    if (!extracted?.heatNumber) {
      setStatus({ type: 'error', msg: 'Heat number is required before saving' })
      return
    }
    onSave({
      ...extracted,
      savedAt: new Date().toLocaleString(),
      status: 'Complete',
      certNumber: `MM-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*900)+100}`
    })
    setStatus({ type: 'success', msg: `✓ Heat ${extracted.heatNumber} saved to Heat Master` })
    setFiles([])
    setExtracted(null)
    setWarnings([])
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <div className={s.wrap}>
      {/* API Key input if not in env */}
      {showKey && (
        <div className={s.keyBox}>
          <label className={s.label}>GEMINI API KEY</label>
          <div className={s.keyRow}>
            <input
              className={s.input} type="password"
              value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="AIza... (from aistudio.google.com)"
            />
            <button className={s.smallBtn} onClick={() => setShowKey(false)} disabled={!apiKey}>
              SET KEY
            </button>
          </div>
          <p className={s.hint}>Key stays in your browser only — never sent anywhere except directly to Google</p>
        </div>
      )}

      <div className={s.grid}>
        {/* LEFT — Upload */}
        <div>
          <h2 className={s.sectionTitle}>01 — UPLOAD DOCUMENTS</h2>

          <div
            className={`${s.dropzone} ${drag ? s.dragOver : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current.click()}
          >
            <input
              ref={inputRef} type="file" accept=".pdf"
              multiple style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)}
            />
            <div className={s.dropIcon}>⬆</div>
            <p className={s.dropMain}>Drop PDF documents here</p>
            <p className={s.dropSub}>Mill Certs · Lab Reports · Purchase Orders</p>
            <p className={s.dropSub}>Multiple files supported — all processed together</p>
          </div>

          {files.length > 0 && (
            <div className={s.fileList}>
              {files.map((f, i) => (
                <div key={i} className={s.fileTag}>
                  <span>📄 {f.name}</span>
                  <button className={s.removeBtn} onClick={() => removeFile(i)}>×</button>
                </div>
              ))}
            </div>
          )}

          <button
            className={s.primaryBtn}
            onClick={extract}
            disabled={!files.length || loading}
          >
            {loading
              ? <span><span className={s.spinner} /> EXTRACTING WITH GEMINI AI...</span>
              : `EXTRACT FROM ${files.length} DOCUMENT${files.length !== 1 ? 'S' : ''}`
            }
          </button>

          {docTypes.length > 0 && (
            <div className={s.docTypesRow}>
              <span className={s.label}>DETECTED:</span>
              {docTypes.map(t => <span key={t} className={s.docBadge}>{t.replace('_', ' ').toUpperCase()}</span>)}
            </div>
          )}

          {warnings.length > 0 && (
            <div className={s.warnBox}>
              <p className={s.warnTitle}>⚠ DATA QUALITY WARNINGS</p>
              {warnings.map((w, i) => <p key={i} className={s.warnItem}>• {w}</p>)}
            </div>
          )}
        </div>

        {/* RIGHT — Verify & Save */}
        <div>
          <h2 className={s.sectionTitle}>02 — VERIFY & SAVE TO HEAT MASTER</h2>

          {status && <div className={`${s.status} ${s[status.type]}`}>{status.msg}</div>}

          {extracted ? (
            <div className={s.formScroll}>
              <div className={s.fieldRow}>
                <div className={s.field}>
                  <label className={s.label}>HEAT NUMBER *</label>
                  <input className={`${s.input} ${s.highlight}`} value={extracted.heatNumber} onChange={e => update(['heatNumber'], e.target.value)} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>GRADE</label>
                  <input className={s.input} value={extracted.grade} onChange={e => update(['grade'], e.target.value)} />
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.field}>
                  <label className={s.label}>MILL NAME</label>
                  <input className={s.input} value={extracted.millName} onChange={e => update(['millName'], e.target.value)} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>WIRE DIAMETER</label>
                  <input className={s.input} value={extracted.diameter} onChange={e => update(['diameter'], e.target.value)} />
                </div>
              </div>
              <div className={s.fieldRow}>
                <div className={s.field}>
                  <label className={s.label}>LOT NUMBER</label>
                  <input className={s.input} value={extracted.lotNumber} onChange={e => update(['lotNumber'], e.target.value)} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>COIL NUMBER</label>
                  <input className={s.input} value={extracted.coilNumber} onChange={e => update(['coilNumber'], e.target.value)} />
                </div>
              </div>

              <p className={s.groupLabel}>CHEMISTRY (%)</p>
              <div className={s.chemGrid}>
                {Object.entries(extracted.chemistry).map(([k, v]) => (
                  <div key={k} className={s.field}>
                    <label className={s.label}>{k.toUpperCase()}</label>
                    <input className={s.input} value={v} onChange={e => update(['chemistry', k], e.target.value)} />
                  </div>
                ))}
              </div>

              <p className={s.groupLabel}>MECHANICAL PROPERTIES</p>
              <div className={s.mechGrid}>
                {Object.entries(extracted.mechanicals).map(([k, v]) => (
                  <div key={k} className={s.field}>
                    <label className={s.label}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                    <input className={s.input} value={v} onChange={e => update(['mechanicals', k], e.target.value)} />
                  </div>
                ))}
              </div>

              <p className={s.groupLabel}>ORDER INFO (FROM INVOICE / PO)</p>
              <div className={s.fieldRow}>
                <div className={s.field}>
                  <label className={s.label}>CUSTOMER</label>
                  <input className={s.input} value={extracted.orderInfo.customer} onChange={e => update(['orderInfo','customer'], e.target.value)} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>PO NUMBER</label>
                  <input className={s.input} value={extracted.orderInfo.poNumber} onChange={e => update(['orderInfo','poNumber'], e.target.value)} />
                </div>
              </div>

              <button className={s.saveBtn} onClick={save} disabled={!extracted.heatNumber}>
                ✓ SAVE HEAT {extracted.heatNumber || '—'} TO MASTER
              </button>
            </div>
          ) : (
            <div className={s.emptyState}>
              <p>Upload documents and run extraction</p>
              <p className={s.emptyHint}>All fields will appear here for review before saving</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
