import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { emsApi, type AdminReportStats } from '../../lib/api'
import { formatCurrency } from '../../lib/format'

const reportTypes = [
  { id: 'tournaments', label: 'Tournament report', description: 'Events, formats, dates, and status.' },
  { id: 'registrations', label: 'Registration report', description: 'Entrants, payment status, and event details.' },
  { id: 'results', label: 'Results report', description: 'Published event results and placements.' },
  { id: 'leaderboard', label: 'Leaderboard report', description: 'Player standings and points.' },
]

function csvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function AdminReportsPage() {
  usePageTitle('Admin reports')
  const [stats, setStats] = useState<AdminReportStats | null>(null)
  const [payments, setPayments] = useState<{ status: string; count: number; total: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [busyReport, setBusyReport] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [reportStats, paymentSummary] = await Promise.all([emsApi.admin.stats(), emsApi.admin.payments()])
      setStats(reportStats)
      setPayments(paymentSummary)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const download = async (type: string, label: string) => {
    setBusyReport(type)
    setError('')
    try {
      const report = await emsApi.admin.export(type)
      const columns = [...new Set(report.rows.flatMap((row) => Object.keys(row)))]
      const contents = [columns.map(csvValue).join(','), ...report.rows.map((row) => columns.map((column) => csvValue(row[column])).join(','))].join('\r\n')
      const blob = new Blob([`\uFEFF${contents}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `ems-${type}-${new Date().toISOString().slice(0, 10)}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
      setBusyReport('')
      if (!report.count) setError(`${label} exported with no records.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to export ${label.toLowerCase()}.`)
      setBusyReport('')
    }
  }

  return <div className="admin-page">
    <header className="admin-page__head">
      <div><p className="eyebrow">Business intelligence</p><h1>Reports</h1><p>Review event, registration, catalog, and payment activity. Export detailed records as CSV.</p></div>
      <button className="btn btn--ghost" type="button" onClick={() => void load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh reports'}</button>
    </header>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="admin-stats" aria-label="EMS reporting summary">
      <article className="admin-stat"><span className="admin-stat__label">Live events</span><strong>{stats?.events.live_events ?? '—'}</strong><span className="admin-stat__meta">{stats?.events.upcoming_events ?? '—'} upcoming</span></article>
      <article className="admin-stat"><span className="admin-stat__label">Registrations</span><strong>{stats?.registrations.total ?? '—'}</strong><span className="admin-stat__meta">{stats?.registrations.confirmed ?? 0} confirmed</span></article>
      <article className="admin-stat"><span className="admin-stat__label">Verified entry revenue</span><strong>{stats ? formatCurrency(stats.verifiedRevenue) : '—'}</strong><span className="admin-stat__meta">Verified registrations</span></article>
      <article className="admin-stat"><span className="admin-stat__label">Catalog listings</span><strong>{stats?.products ?? '—'}</strong><span className="admin-stat__meta">Merchandise and singles</span></article>
    </section>
    <div className="admin-grid admin-report-grid">
      <section className="admin-panel">
        <div className="admin-panel__head"><div><p className="eyebrow">Payment breakdown</p><h2>Registration payments</h2></div></div>
        {loading ? <div className="admin-empty">Loading payment totals…</div> : payments.length ? <div className="admin-report-payments">{payments.map((payment) => <div key={payment.status}><span><strong>{payment.status}</strong><small>{payment.count} registrations</small></span><b>{formatCurrency(Number(payment.total))}</b></div>)}</div> : <div className="admin-empty"><strong>No payment records.</strong><span>Payment summaries will appear as registrations come in.</span></div>}
        {stats && <p className="admin-report-note">{stats.registrations.pending_payments} registrations are waiting for payment review. <Link to="/admin/payments">Open payment desk →</Link></p>}
      </section>
      <section className="admin-panel">
        <div className="admin-panel__head"><div><p className="eyebrow">Data exports</p><h2>Download reports</h2></div></div>
        <div className="admin-report-downloads">{reportTypes.map((report) => <article key={report.id}><span><strong>{report.label}</strong><small>{report.description}</small></span><button className="btn btn--ghost btn--small" type="button" disabled={Boolean(busyReport)} onClick={() => void download(report.id, report.label)}>{busyReport === report.id ? 'Preparing…' : 'Export CSV'}</button></article>)}</div>
      </section>
    </div>
  </div>
}
