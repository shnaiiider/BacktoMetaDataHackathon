import React, { useState, useEffect } from 'react'
import './Header.css'

const PAGE_TITLES = {
  overview: { title: 'Dashboard Overview', sub: 'Real-time data observability across your stack' },
  freshness: { title: 'Table Freshness', sub: 'Monitor last updated times and staleness' },
  tests: { title: 'Data Quality', sub: 'Test results and quality metrics' },
  pipelines: { title: 'Pipeline Status', sub: 'Ingestion and ETL pipeline health' },
}

export default function Header({ page }) {
  const [time, setTime] = useState(new Date())
  const info = PAGE_TITLES[page] || PAGE_TITLES.overview

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const ss = String(time.getSeconds()).padStart(2, '0')

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{info.title}</h1>
        <p className="page-sub">{info.sub}</p>
      </div>
      <div className="header-right">
        <div className="live-clock mono">{hh}:{mm}:{ss} UTC</div>
        <div className="refresh-badge">
          <span className="refresh-dot" />
          Auto-refresh 30s
        </div>
      </div>
    </header>
  )
}
