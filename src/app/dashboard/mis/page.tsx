'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'

const WORK_TYPES = ['PMI', 'RPMI', 'Cable Termination', 'Lighting Repair', 'Breaker Maintenance', 'Motor Replacement', 'Panel Work', 'Other']
const SHIFTS = ['A', 'B', 'C']
const AREAS = ['M-1 Furnace', 'M-2 Furnace', 'Reformer Area', 'DRI Handling Area', 'Utilities', 'Substation', 'Control Room']

export default function MISPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState({ area: '', status: '' })
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'A', area: '', equipmentName: '', tagNumber: '',
    workType: 'PMI', description: '', engineerName: user?.name || '',
  })

  useEffect(() => { fetchMIS() }, [filter])
  useEffect(() => { setForm(f => ({ ...f, engineerName: user?.name || '' })) }, [user])

  const fetchMIS = async () => {
    const params = new URLSearchParams()
    if (filter.area) params.set('area', filter.area)
    if (filter.status) params.set('status', filter.status)
    const res = await fetch(`/api/mis?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) setEntries(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/mis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setShowForm(false); fetchMIS() }
    } finally { setLoading(false) }
  }

  const handleApprove = async (id: string) => {
    await fetch('/api/mis', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'APPROVED' }) })
    fetchMIS()
  }

  const canCreate = ['ENGINEER', 'SUPERVISOR'].includes(user?.role)

  return (
    <DashboardLayout
      title="Daily MIS"
      subtitle="Maintenance Information System"
      actions={canCreate ? <button className="btn btn-primary btn-sm" id="create-mis-btn" onClick={() => setShowForm(true)}>+ New Entry</button> : undefined}
    >
      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: '180px' }} value={filter.area} onChange={e => setFilter({...filter, area: e.target.value})}>
          <option value="">All Areas</option>
          {AREAS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select className="form-select" style={{ width: '160px' }} value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
          <option value="">All Status</option>
          <option value="DRAFT">Pending</option>
          <option value="APPROVED">Approved</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchMIS}>🔄 Refresh</button>
        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '13px', alignSelf: 'center' }}>
          {entries.length} entries
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th><th>Shift</th><th>Area</th><th>Equipment</th>
              <th>Tag</th><th>Work Type</th><th>Description</th><th>Engineer</th>
              <th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No MIS entries found. {canCreate && <span onClick={() => setShowForm(true)} style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Create one →</span>}
              </td></tr>
            ) : entries.map(e => (
              <tr key={e.id}>
                <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td><span className="badge badge-gray">Shift {e.shift}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.area}</td>
                <td style={{ fontWeight: 600 }}>{e.equipmentName}</td>
                <td><span className="tag">{e.tagNumber || '—'}</span></td>
                <td><span className="badge badge-blue">{e.workType}</span></td>
                <td style={{ fontSize: '12px', maxWidth: '180px', color: 'var(--text-secondary)' }}>{e.description.substring(0, 60)}…</td>
                <td style={{ fontSize: '12px' }}>{e.engineerName}</td>
                <td><span className={`badge ${e.status === 'APPROVED' ? 'badge-green' : 'badge-amber'}`}>{e.status}</span></td>
                <td>
                  {e.status === 'DRAFT' && canCreate && (
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(e.id)}>✓ Approve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 New MIS Entry</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Shift</label>
                  <select className="form-select" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})}>
                    {SHIFTS.map(s => <option key={s}>Shift {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Area</label>
                <select className="form-select" value={form.area} onChange={e => setForm({...form, area: e.target.value})} required>
                  <option value="">Select area...</option>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Equipment Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Main Air Fan" value={form.equipmentName} onChange={e => setForm({...form, equipmentName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tag Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 24.04.04" value={form.tagNumber} onChange={e => setForm({...form, tagNumber: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Work Type</label>
                <select className="form-select" value={form.workType} onChange={e => setForm({...form, workType: e.target.value})}>
                  {WORK_TYPES.map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Describe the maintenance work done..." rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Engineer Name</label>
                <input type="text" className="form-input" value={form.engineerName} onChange={e => setForm({...form, engineerName: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="mis-submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : '✅ Save MIS Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
