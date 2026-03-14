'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', tagNumber: '', area: '', equipmentType: '', manufacturer: '', installDate: '' })

  const AREAS = ['M-1 Furnace', 'M-2 Furnace', 'Reformer Area', 'DRI Handling Area', 'Utilities', 'Substation']
  const TYPES = ['Motor', 'Transformer', 'Panel', 'Cable', 'Switch', 'Pump', 'Fan', 'Compressor', 'Light', 'Other']

  useEffect(() => { fetchEquipment() }, [search])

  const fetchEquipment = async () => {
    const res = await fetch(`/api/equipment${search ? `?tag=${search}` : ''}`)
    const data = await res.json()
    if (Array.isArray(data)) setEquipment(data)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/equipment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowForm(false); fetchEquipment()
  }

  return (
    <DashboardLayout title="Equipment Database" subtitle="Master equipment registry" actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} id="add-equipment-btn">+ Add Equipment</button>}>
      <div className="card" style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <input type="search" className="search-bar" placeholder="🔍 Search by tag or name..." value={search} onChange={e => setSearch(e.target.value)} id="equipment-search" />
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Tag</th><th>Name</th><th>Type</th><th>Area</th><th>Manufacturer</th><th>Status</th></tr></thead>
          <tbody>
            {equipment.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No equipment added yet.<br/><span onClick={() => setShowForm(true)} style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Add equipment →</span></td></tr>
            ) : equipment.map(e => (
              <tr key={e.id}>
                <td><span className="tag">{e.tagNumber}</span></td>
                <td style={{ fontWeight: 600 }}>{e.name}</td>
                <td><span className="badge badge-purple">{e.equipmentType}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.area}</td>
                <td style={{ fontSize: '12px' }}>{e.manufacturer || '—'}</td>
                <td><span className={`badge ${e.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">🔌 Add Equipment</h3><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" placeholder="Main Air Fan" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Tag Number</label><input className="form-input" placeholder="24.04.04" value={form.tagNumber} onChange={e => setForm({...form, tagNumber: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Area</label><select className="form-select" value={form.area} onChange={e => setForm({...form, area: e.target.value})} required><option value="">Select...</option>{AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.equipmentType} onChange={e => setForm({...form, equipmentType: e.target.value})} required><option value="">Select...</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Manufacturer</label><input className="form-input" placeholder="ABB / Siemens" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Install Date</label><input type="date" className="form-input" value={form.installDate} onChange={e => setForm({...form, installDate: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="equipment-save-btn">💾 Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
