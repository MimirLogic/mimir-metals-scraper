import { useState } from 'react'
import IntakeMode from './components/IntakeMode.jsx'
import GenerateMode from './components/GenerateMode.jsx'
import HeatMaster from './components/HeatMaster.jsx'
import styles from './App.module.css'

export default function App() {
  const [mode, setMode] = useState('intake')
  const [heatMaster, setHeatMaster] = useState({})

  const addHeat = (heat) => {
    setHeatMaster(prev => ({ ...prev, [heat.heatNumber]: heat }))
  }

  const heatCount = Object.keys(heatMaster).length

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.logo}>MIMIR METALS</h1>
          <p className={styles.tagline}>"See what Time forgot" — Mill Cert Reconciliation</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.badge}>{heatCount} heat{heatCount !== 1 ? 's' : ''} in master</span>
          <span className={styles.poweredBy}>Powered by Mimir Logic AI</span>
        </div>
      </header>

      <nav className={styles.nav}>
        {[
          { id: 'intake',   label: '⬆ INTAKE MODE',    desc: 'Upload & Extract' },
          { id: 'generate', label: '📄 GENERATE MODE',  desc: 'Build Certs'     },
          { id: 'master',   label: '🗄 HEAT MASTER',    desc: `${heatCount} Records`},
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.navBtn} ${mode === tab.id ? styles.navActive : ''}`}
            onClick={() => setMode(tab.id)}
          >
            <span className={styles.navLabel}>{tab.label}</span>
            <span className={styles.navDesc}>{tab.desc}</span>
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {mode === 'intake'   && <IntakeMode   onSave={addHeat} />}
        {mode === 'generate' && <GenerateMode heatMaster={heatMaster} />}
        {mode === 'master'   && <HeatMaster   heatMaster={heatMaster} />}
      </main>

      <footer className={styles.footer}>
        <span>Mimir Logic LLC — Warren, Michigan</span>
        <span>mimirlogic.netlify.app</span>
        <span>Demo Version — In-Browser Storage</span>
      </footer>
    </div>
  )
}
