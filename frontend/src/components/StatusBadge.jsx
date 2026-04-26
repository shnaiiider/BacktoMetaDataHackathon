import React from 'react'
import './StatusBadge.css'

const VARIANTS = {
  // freshness
  fresh:    { color: 'accent', label: 'Fresh' },
  stale:    { color: 'warn',   label: 'Stale' },
  critical: { color: 'danger', label: 'Critical' },
  // tests
  Success:  { color: 'accent', label: 'Passed' },
  Failed:   { color: 'danger', label: 'Failed' },
  Aborted:  { color: 'warn',   label: 'Aborted' },
  // pipelines
  successful: { color: 'accent',  label: 'Success' },
  failed:     { color: 'danger',  label: 'Failed' },
  running:    { color: 'info',    label: 'Running' },
  queued:     { color: 'purple',  label: 'Queued' },
  unknown:    { color: 'muted',   label: 'Unknown' },
}

export default function StatusBadge({ status }) {
  const v = VARIANTS[status] || { color: 'muted', label: status }
  return (
    <span className={`status-badge status-badge--${v.color}`}>
      <span className="badge-dot" />
      {v.label}
    </span>
  )
}
