import React, { useState } from 'react'
import { useData } from '../hooks/useData.js'
import { fetchTests, formatTimeAgo, formatNumber } from '../utils/api.js'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import './TestsPage.css'

const STATUS_FILTERS = ['all', 'Success', 'Failed', 'Aborted']

export default function TestsPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data, loading, error, refetch } = useData(
    () => fetchTests({ status: filter === 'all' ? undefined : filter }),
    [filter]
  )

  if (loading) return <LoadingSpinner label="Loading test results…" />
  if (error) return <div className="error-msg">Error: {error}</div>

  const { tests = [], summary = {} } = data || {}

  const filtered = tests.filter(t =>
    !search || t.tableName.includes(search) || t.testName.includes(search)
  )

  // Group by test type
  const testTypeCounts = {}
  tests.forEach(t => {
    testTypeCounts[t.testName] = (testTypeCounts[t.testName] || { passed: 0, failed: 0 })
    if (t.status === 'Success') testTypeCounts[t.testName].passed++
    else if (t.status === 'Failed') testTypeCounts[t.testName].failed++
  })
  const testTypeData = Object.entries(testTypeCounts)
    .map(([name, counts]) => ({ name: name.replace('columnValues', '').replace('table', 'table '), ...counts }))
    .sort((a, b) => (b.passed + b.failed) - (a.passed + a.failed))
    .slice(0, 8)

  const passRate = summary.passRate ?? 0
  const passRateColor = passRate >= 90 ? 'var(--accent)' : passRate >= 70 ? 'var(--warn)' : 'var(--danger)'

  return (
    <div className="tests-page">
      {/* KPIs */}
      <div className="t-kpi-grid">
        <StatCard label="Total Tests" value={summary.total} color="info" icon="◈" />
        <StatCard label="Pass Rate" value={`${passRate}%`} color={passRate >= 80 ? 'accent' : 'danger'} sub="Overall quality score" />
        <StatCard label="Passed" value={summary.passed} color="accent" icon="✓" />
        <StatCard label="Failed" value={summary.failed} color="danger" icon="✕" sub={`${summary.aborted} aborted`} />
      </div>

      {/* Pass rate bar + test type bar */}
      <div className="tests-charts-row">
        {/* Pass rate gauge */}
        <div className="gauge-card">
          <div className="section-title">Overall Pass Rate</div>
          <div className="gauge-number" style={{ color: passRateColor }}>{passRate}%</div>
          <div className="gauge-bar-wrap">
            <div className="gauge-bar-track">
              <div
                className="gauge-bar-fill"
                style={{ width: `${passRate}%`, background: passRateColor, boxShadow: `0 0 12px ${passRateColor}60` }}
              />
            </div>
            <div className="gauge-labels mono">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="gauge-breakdown">
            <div className="gb-item accent"><span className="gb-val">{summary.passed}</span><span className="gb-label">Passed</span></div>
            <div className="gb-item danger"><span className="gb-val">{summary.failed}</span><span className="gb-label">Failed</span></div>
            <div className="gb-item warn"><span className="gb-val">{summary.aborted}</span><span className="gb-label">Aborted</span></div>
          </div>
        </div>

        {/* Test type breakdown */}
        <div className="test-type-card">
          <div className="section-title">Tests by Type</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={testTypeData} layout="vertical" barSize={10} barGap={2}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                itemStyle={{ color: 'var(--text)' }}
              />
              <Bar dataKey="passed" fill="#4fffb0" fillOpacity={0.85} radius={[0, 3, 3, 0]} />
              <Bar dataKey="failed" fill="#ff4f6b" fillOpacity={0.85} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="filter-tabs">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-tab ${filter === s ? 'active' : ''} ${s === 'Failed' ? 'danger-tab' : ''}`}
              onClick={() => setFilter(s)}>
              {s === 'Success' ? 'Passed' : s}
              {s !== 'all' && <span className="tab-count">{summary[s === 'Success' ? 'passed' : s.toLowerCase()] ?? 0}</span>}
            </button>
          ))}
        </div>
        <div className="controls-right">
          <input
            className="search-input mono"
            type="text"
            placeholder="Search tests…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-refresh" onClick={refetch}>↻ Refresh</button>
        </div>
      </div>

      {/* Tests Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Test Name</th>
              <th>Status</th>
              <th>Passed Rows</th>
              <th>Failed Rows</th>
              <th>Last Run</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="no-data mono">No tests found</td></tr>
            )}
            {filtered.map(t => (
              <tr key={t.id} className={t.status === 'Failed' ? 'row-failed' : t.status === 'Aborted' ? 'row-aborted' : 'row-ok'}>
                <td><span className="cell-name mono">{t.tableName}</span></td>
                <td><span className="test-name-pill mono">{t.testName}</span></td>
                <td><StatusBadge status={t.status} /></td>
                <td><span className="mono accent-text">{formatNumber(t.passedRows)}</span></td>
                <td>
                  <span className={`mono ${t.failedRows > 0 ? 'danger-text' : 'muted-text'}`}>
                    {t.failedRows > 0 ? formatNumber(t.failedRows) : '—'}
                  </span>
                </td>
                <td><span className="cell-muted mono">{formatTimeAgo(t.lastRun)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer mono">Showing {filtered.length} of {tests.length} tests</div>
    </div>
  )
}
