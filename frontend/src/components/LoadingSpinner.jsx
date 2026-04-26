import React from 'react'
import './LoadingSpinner.css'

export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner-ring" />
      <div className="spinner-label mono">{label}</div>
    </div>
  )
}
