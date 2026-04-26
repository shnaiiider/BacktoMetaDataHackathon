import React from 'react'
import './StatCard.css'

export default function StatCard({ label, value, sub, color = 'accent', icon, trend }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}
