const BASE = '/api'

export async function fetchOverview() {
  const r = await fetch(`${BASE}/overview`)
  if (!r.ok) throw new Error('Failed to fetch overview')
  return r.json()
}

export async function fetchFreshness({ status, database } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (database) params.set('database', database)
  const r = await fetch(`${BASE}/tables/freshness?${params}`)
  if (!r.ok) throw new Error('Failed to fetch table freshness')
  return r.json()
}

export async function fetchTests({ status } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const r = await fetch(`${BASE}/tests/results?${params}`)
  if (!r.ok) throw new Error('Failed to fetch test results')
  return r.json()
}

export async function fetchPipelines({ status } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const r = await fetch(`${BASE}/pipelines/status?${params}`)
  if (!r.ok) throw new Error('Failed to fetch pipeline status')
  return r.json()
}

export function formatTimeAgo(isoString) {
  if (!isoString) return 'Unknown'
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function formatNumber(n) {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
