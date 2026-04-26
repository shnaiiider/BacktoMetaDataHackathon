import React, { useState } from 'react'
import { useData } from '../hooks/useData.js'
import { fetchPipelines, formatTimeAgo } from '../utils/api.js'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import './PipelinesPage.css'

const STATUS_FILTERS = ['all', 'successful', 'failed', 'running', 'queued']

function formatDuration(seconds) {
  if (!seconds) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

function PipelineCard({ pipeline }) {
  const isRunning = pipeline.status === 'running'
  const isFailed = pipeline.status === 'failed'

  return (
    <div className={`pipeline-card pipeline-card--${pipeline.status}`}>
      <div className="pc-top">
        <div className="pc-info">
          <div className="pc-name mono">{pipeline.name}</div>
          <div className="pc-meta">
            <span className="pc-service">{pipeline.service}</span>
            <span className="pc-dot">·</span>
            <span className="pc-type">{pipeline.pipelineType}</span>
          </div>
        </div>
        <StatusBadge status={pipeline.status} />
      </div>

      <div className="pc-stats">
        <div className="pc-stat">
          <div className="pc-stat-label mono">Started</div>
          <div className="pc-stat-val mono">{formatTimeAgo(pipeline.startTime)}</div>
        </div>
        <div className="pc-stat">
          <div className="pc-stat-label mono">Duration</div>
          <div className="pc-stat-val mono">{formatDuration(pipeline.duration)}</div>
        </div>
        <div className="pc-stat">
          <div className="pc-stat-label mono">Records</div>
          <div className="pc-stat-val mono">{pipeline.records?.toLocaleString() ?? '—'}</div>
        </div>
      </div>

      {isRunning && (
        <div className="pc-progress">
          <div className="pc-progress-bar">
            <div className="pc-progress-fill running-anim" />
          </div>
          <span className="pc-progress-label mono">In progress…</span>
        </div>
      )}

      {isFailed && (
        <div className="pc-error-strip mono">
          ✕ Pipeline failed — check logs for details
        </div>
      )}
    </div>
  )
}

export default function PipelinesPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data, loading, error, refetch } = useData(
    () => fetchPipelines({ status: filter === 'all' ? undefined : filter }),
    [filter]
  )

  if (loading) return <LoadingSpinner label="Loading pipeline status…" />
  if (error) return <div className="error-msg">Error: {error}</div>

  const { pipelines = [], summary = {} } = data || {}

  const filtered = pipelines.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.service.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pipelines-page">
      {/* KPIs */}
      <div className="p-kpi-grid">
        <StatCard label="Total Pipelines" value={summary.total} color="info" icon="⊏" />
        <StatCard label="Successful" value={summary.successful} color="accent" sub="Last run OK" icon="✓" />
        <StatCard label="Failed" value={summary.failed} color="danger" sub="Needs attention" icon="✕" />
        <StatCard label="Running Now" value={summary.running} color="info" sub={`${summary.queued} queued`} icon="▶" />
      </div>

      {/* Timeline-style status strip */}
      <div className="status-strip-card">
        <div className="section-title">Pipeline Health Snapshot</div>
        <div className="status-strip">
          {pipelines.map(p => (
            <div key={p.id} className={`strip-block strip-block--${p.status}`} title={`${p.name}: ${p.status}`} />
          ))}
        </div>
        <div className="strip-legend">
          {['successful','failed','running','queued'].map(s => (
            <div key={s} className="strip-legend-item">
              <span className={`strip-legend-dot strip-dot--${s}`} />
              <span className="mono">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="filter-tabs">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-tab ${filter === s ? 'active' : ''} ${s === 'failed' ? 'danger-tab' : ''} ${s === 'running' ? 'info-tab' : ''}`}
              onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && <span className="tab-count">{summary[s] ?? 0}</span>}
            </button>
          ))}
        </div>
        <div className="controls-right">
          <input
            className="search-input mono"
            type="text"
            placeholder="Search pipelines…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-refresh" onClick={refetch}>↻ Refresh</button>
        </div>
      </div>

      {/* Pipeline Cards Grid */}
      <div className="pipelines-grid">
        {filtered.length === 0 && (
          <div className="empty-state mono">No pipelines found</div>
        )}
        {filtered.map(p => (
          <PipelineCard key={p.id} pipeline={p} />
        ))}
      </div>

      <div className="table-footer mono">
        {filtered.length} pipelines shown
      </div>
    </div>
  )
}
