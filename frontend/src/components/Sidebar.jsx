import React from 'react'
import './Sidebar.css'

const NAV = [
  { id: 'overview', label: 'Overview', icon: '⬡' },
  { id: 'freshness', label: 'Table Freshness', icon: '◷' },
  { id: 'tests', label: 'Data Quality', icon: '◈' },
  { id: 'pipelines', label: 'Pipelines', icon: '⊏' },
]

export default function Sidebar({ active, onNav }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">◈</span>
        <div className="brand-text">
          <div className="brand-name">OpenMeta</div>
          <div className="brand-sub">Observatory</div>
        </div>
      </div>

      <div className="sidebar-demo-badge">
        <span className="demo-dot" />
        DEMO MODE
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {active === item.id && <span className="nav-active-bar" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-version mono">v1.0.0</div>
        <div className="footer-status">
          <span className="status-dot" />
          API connected
        </div>
      </div>
    </aside>
  )
}
