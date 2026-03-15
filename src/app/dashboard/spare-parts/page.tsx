'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SparePartsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isEngineer = user?.role === 'ENGINEER' || user?.role === 'SUPERVISOR'

  const [activeTab, setActiveTab] = useState<'inventory' | 'pending'>('inventory')
  const [parts, setParts] = useState<any[]>([])
  const [pendingUsages, setPendingUsages] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ partName: '', partNumber: '', equipment: '', quantity: '0', location: '', supplier: '' })
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => { 
    fetchParts()
    if (isEngineer) fetchPendingUsages()
  }, [isEngineer])

  const fetchParts = async () => {
    const res = await fetch('/api/spare-parts')
    const data = await res.json()
    if (Array.isArray(data)) setParts(data)
  }

  const fetchPendingUsages = async () => {
    const res = await fetch('/api/spare-parts/usage')
    const data = await res.json()
    if (Array.isArray(data)) {
      setPendingUsages(data.filter((u: any) => u.status === 'PENDING'))
    }
  }

  const filtered = parts.filter(p =>
    !search || p.partName.toLowerCase().includes(search.toLowerCase()) || p.partNumber.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/spare-parts', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...form, quantity: parseInt(form.quantity) }) 
    })
    setShowForm(false); 
    fetchParts()
  }

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/spare-parts/usage/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchPendingUsages()
        fetchParts()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update status')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessingId(null)
    }
  }

  const lowStock = parts.filter(p => p.quantity < 3).length

  return (
    <DashboardLayout 
      title="Spare Parts" 
      subtitle="Inventory & Approval Management" 
      actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} id="add-part-btn">+ Add Part</button>}
    >
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '20px' }}>
        {[
          { label: 'Total Parts', value: parts.length, icon: '🔧', color: '#3b82f6' },
          { label: 'Low Stock (<3)', value: lowStock, icon: '⚠️', color: '#f59e0b' },
          { label: 'Pending Approvals', value: pendingUsages.length, icon: '⏳', color: '#8b5cf6' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', fontSize: '22px' }}>{k.icon}</div>
            <div className="kpi-info">
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory List
        </button>
        {isEngineer && (
          <button 
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('pending')}
            style={{ position: 'relative' }}
          >
            Pending Approvals
            {pendingUsages.length > 0 && (
              <span style={{ 
                position: 'absolute', top: '-8px', right: '-8px', 
                background: 'var(--accent-red)', color: 'white', 
                fontSize: '10px', padding: '2px 6px', borderRadius: '10px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
              }}>
                {pendingUsages.length}
              </span>
            )}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'inventory' ? (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="card" style={{ marginBottom: '16px' }}>
              <input type="search" className="form-input" placeholder="🔍 Search parts..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Part Name</th><th>Part Number</th><th>Equipment</th><th>Qty</th><th>Location</th><th>Supplier</th></tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No spare parts found.</td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.partName}</td>
                      <td><span className="tag">{p.partNumber}</span></td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.equipment || '—'}</td>
                      <td><span className={`badge ${p.quantity < 3 ? 'badge-red' : p.quantity < 10 ? 'badge-amber' : 'badge-green'}`}>{p.quantity}</span></td>
                      <td style={{ fontSize: '12px' }}>{p.location || '—'}</td>
                      <td style={{ fontSize: '12px' }}>{p.supplier || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Part Name</th><th>Qty Used</th><th>Reported By</th><th>Reason</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {pendingUsages.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No pending requests.</td></tr>
                  ) : pendingUsages.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.sparePart.partName}</td>
                      <td><span className="badge badge-amber">{u.quantityUsed}</span></td>
                      <td style={{ fontSize: '12px' }}>{u.reportedBy.name}</td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.reason || '—'}</td>
                      <td style={{ fontSize: '12px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-success btn-sm" 
                            disabled={processingId === u.id}
                            onClick={() => handleApprove(u.id, 'APPROVED')}
                          >
                            {processingId === u.id ? '...' : 'Approve ✅'}
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            disabled={processingId === u.id}
                            onClick={() => handleApprove(u.id, 'REJECTED')}
                          >
                            Reject ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">🔧 Add Spare Part</h3><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Part Name</label><input className="form-input" placeholder="6316 C3 Bearing" value={form.partName} onChange={e => setForm({...form, partName: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Part Number</label><input className="form-input" placeholder="BRG-6316-C3" value={form.partNumber} onChange={e => setForm({...form, partNumber: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Equipment</label><input className="form-input" placeholder="Motor / Fan" value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Quantity</label><input type="number" className="form-input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Location</label><input className="form-input" placeholder="Warehouse A, Rack 3" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Supplier</label><input className="form-input" placeholder="SKF India" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="spare-save-btn">💾 Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
