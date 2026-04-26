import React, { useState } from 'react'
import { useData } from '../hooks/useData.js'
import { fetchFreshness, formatTimeAgo, formatNumber } from '../utils/api.js'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './FreshnessPage.css'

const STATUS_FILTERS = ['all', 'fresh', 'stale', 'critical']

export default function FreshnessPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('hoursAgo')

  const { data, loading, error, refetch } = useData(
    () => fetchFreshness({ status: filter === 'all' ? undefined : filter }),
    [filter]
  )

  if (loading) return <LoadingSpinner label="Loading table freshness…" />
  if (error) return <div className="error-msg">Error: {error}</div>

  const { tables = [], summary = {} } = data || {}

  const filtered = tables
    .filter(t => !search || t.name.includes(search) || t.database.includes(search) || t.schema.includes(search))
    .sort((a, b) => {
      if (sortBy === 'hoursAgo') return b.hoursAgo - a.hoursAgo
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'rowCount') return b.rowCount - a.rowCount
      return 0
    })

  // Histogram: bucket by hours
  const buckets = [
    { label: '<1h', count: tables.filter(t => t.hoursAgo < 1).length },
    { label: '1-4h', count: tables.filter(t => t.hoursAgo >= 1 && t.hoursAgo < 4).length },
    { label: '4-12h', count: tables.filter(t => t.hoursAgo >= 4 && t.hoursAgo < 12).length },
    { label: '12-24h', count: tables.filter(t => t.hoursAgo >= 12 && t.hoursAgo < 24).length },
    { label: '1-3d', count: tables.filter(t => t.hoursAgo >= 24 && t.hoursAgo < 72).length },
    { label: '3d+', count: tables.filter(t => t.hoursAgo >= 72).length },
  ]

  const bucketColors = ['#4fffb0','#4fffb0','#ffb84f','#ffb84f','#ff4f6b','#ff4f6b']

  return (
    <div className="freshness-page">
      {/* KPIs */}
      <div className="f-kpi-grid">
        <StatCard label="Total Tables" value={summary.total} color="accent" icon="⬡" />
        <StatCard label="Fresh" value={summary.fresh} sub="Updated within 4h" color="accent" icon="◉" />
        <StatCard label="Stale" value={summary.stale} sub="4h – 24h old" color="warn" icon="◎" />
        <StatCard label="Critical" value={summary.critical} sub="Not updated 24h+" color="danger" icon="◯" />
      </div>

      {/* Histogram */}
      <div className="histogram-card">
        <div className="section-title">Update Frequency Distribution</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={buckets} barSize={32}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}
              labelStyle={{ color: 'var(--text)' }}
              itemStyle={{ color: 'var(--accent)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {buckets.map((_, i) => <Cell key={i} fill={bucketColors[i]} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="filter-tabs">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && <span className="tab-count">{summary[s] ?? 0}</span>}
            </button>
          ))}
        </div>
        <div className="controls-right">
          <input
            className="search-input mono"
            type="text"
            placeholder="Search tables…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="sort-select mono" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="hoursAgo">Sort: Stalest First</option>
            <option value="name">Sort: Name</option>
            <option value="rowCount">Sort: Row Count</option>
          </select>
          <button className="btn-refresh" onClick={refetch}>↻ Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Database · Schema</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Row Count</th>
              <th>Columns</th>
              <th>Owner</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="no-data mono">No tables found</td></tr>
            )}
            {filtered.map(t => (
              <tr key={t.id} className={`row-${t.freshnessStatus}`}>
                <td><span className="cell-name mono">{t.name}</span></td>
                <td><span className="cell-muted mono">{t.database} · {t.schema}</span></td>
                <td><StatusBadge status={t.freshnessStatus} /></td>
                <td>
                  <span className="cell-time mono" title={t.lastUpdated}>
                    {t.hoursAgo < 1 ? `${Math.round(t.hoursAgo * 60)}m ago` : `${t.hoursAgo}h ago`}
                  </span>
                </td>
                <td><span className="mono">{formatNumber(t.rowCount)}</span></td>
                <td><span className="mono">{t.columnCount}</span></td>
                <td><span className="cell-muted mono">{t.owner}</span></td>
                <td>
                  <div className="tag-list">
                    {(t.tags || []).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer mono">
        Showing {filtered.length} of {tables.length} tables
      </div>
    </div>
  )
}
