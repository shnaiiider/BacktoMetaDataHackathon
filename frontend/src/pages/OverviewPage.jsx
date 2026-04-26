import React from 'react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts'
import { useData } from '../hooks/useData.js'
import { fetchOverview, fetchFreshness, fetchTests, fetchPipelines } from '../utils/api.js'
import StatCard from '../components/StatCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import './OverviewPage.css'

function DonutChart({ data, colors }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={76}
          dataKey="value" strokeWidth={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}
          itemStyle={{ color: 'var(--text)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default function OverviewPage() {
  const { data: overview, loading: ol } = useData(fetchOverview)
  const { data: freshnessData } = useData(fetchFreshness)
  const { data: testsData } = useData(fetchTests)
  const { data: pipelinesData } = useData(fetchPipelines)

  if (ol || !overview) return <LoadingSpinner label="Fetching overview…" />

  const { tables, tests, pipelines } = overview

  const freshnessDonut = [
    { name: 'Fresh', value: tables.fresh },
    { name: 'Stale', value: tables.stale },
    { name: 'Critical', value: tables.critical },
  ]
  const testsDonut = [
    { name: 'Passed', value: tests.passed },
    { name: 'Failed', value: tests.failed },
    { name: 'Aborted', value: tests.aborted },
  ]
  const pipelinesDonut = [
    { name: 'Successful', value: pipelines.successful },
    { name: 'Failed', value: pipelines.failed },
    { name: 'Running', value: pipelines.running },
    { name: 'Queued', value: pipelines.queued },
  ]

  const recentTables = freshnessData?.tables?.slice(0, 5) || []
  const recentTests = testsData?.tests?.filter(t => t.status === 'Failed').slice(0, 5) || []
  const recentPipelines = pipelinesData?.pipelines?.slice(0, 6) || []

  return (
    <div className="overview-page">
      {/* KPI Row */}
      <div className="kpi-grid">
        <StatCard label="Total Tables" value={tables.total} sub={`${tables.fresh} fresh · ${tables.stale} stale · ${tables.critical} critical`} color="accent" icon="⬡" />
        <StatCard label="Pass Rate" value={`${tests.passRate}%`} sub={`${tests.passed} passed · ${tests.failed} failed`} color={tests.passRate >= 80 ? 'accent' : 'danger'} icon="◈" />
        <StatCard label="Pipelines" value={pipelines.total} sub={`${pipelines.successful} ok · ${pipelines.failed} failed · ${pipelines.running} live`} color="info" icon="⊏" />
        <StatCard label="Critical Tables" value={tables.critical} sub="Not updated in 24h+" color={tables.critical > 3 ? 'danger' : 'warn'} icon="◷" />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Table Freshness</span>
          </div>
          <DonutChart
            data={freshnessDonut}
            colors={['#4fffb0', '#ffb84f', '#ff4f6b']}
          />
          <div className="donut-legend">
            {freshnessDonut.map((d, i) => (
              <div key={d.name} className="legend-item">
                <span className="legend-dot" style={{ background: ['#4fffb0','#ffb84f','#ff4f6b'][i] }} />
                <span>{d.name}</span>
                <span className="legend-val mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Quality Tests</span>
          </div>
          <DonutChart
            data={testsDonut}
            colors={['#4fffb0', '#ff4f6b', '#ffb84f']}
          />
          <div className="donut-legend">
            {testsDonut.map((d, i) => (
              <div key={d.name} className="legend-item">
                <span className="legend-dot" style={{ background: ['#4fffb0','#ff4f6b','#ffb84f'][i] }} />
                <span>{d.name}</span>
                <span className="legend-val mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Pipeline Status</span>
          </div>
          <DonutChart
            data={pipelinesDonut}
            colors={['#4fffb0', '#ff4f6b', '#4f9fff', '#a64fff']}
          />
          <div className="donut-legend">
            {pipelinesDonut.map((d, i) => (
              <div key={d.name} className="legend-item">
                <span className="legend-dot" style={{ background: ['#4fffb0','#ff4f6b','#4f9fff','#a64fff'][i] }} />
                <span>{d.name}</span>
                <span className="legend-val mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Detail Row */}
      <div className="detail-row">
        {/* Stale/Critical Tables */}
        <div className="detail-card">
          <div className="detail-header">
            <span className="detail-title">⚠ Tables Needing Attention</span>
          </div>
          <div className="detail-list">
            {recentTables.length === 0 && <div className="empty-state mono">All tables fresh</div>}
            {recentTables.map(t => (
              <div key={t.id} className="detail-row-item">
                <div className="detail-row-left">
                  <div className="table-name mono">{t.name}</div>
                  <div className="table-meta">{t.database} · {t.schema}</div>
                </div>
                <div className="detail-row-right">
                  <StatusBadge status={t.freshnessStatus} />
                  <div className="detail-time mono">{t.hoursAgo}h ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed Tests */}
        <div className="detail-card">
          <div className="detail-header">
            <span className="detail-title">✕ Failed Quality Tests</span>
          </div>
          <div className="detail-list">
            {recentTests.length === 0 && <div className="empty-state mono">No failures detected</div>}
            {recentTests.map(t => (
              <div key={t.id} className="detail-row-item">
                <div className="detail-row-left">
                  <div className="table-name mono">{t.tableName}</div>
                  <div className="table-meta">{t.testName}</div>
                </div>
                <div className="detail-row-right">
                  <StatusBadge status={t.status} />
                  <div className="detail-fail mono">{t.failedRows} rows</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="detail-card">
          <div className="detail-header">
            <span className="detail-title">⊏ Recent Pipelines</span>
          </div>
          <div className="detail-list">
            {recentPipelines.map(p => (
              <div key={p.id} className="detail-row-item">
                <div className="detail-row-left">
                  <div className="table-name mono">{p.name}</div>
                  <div className="table-meta">{p.service} · {p.pipelineType}</div>
                </div>
                <div className="detail-row-right">
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
