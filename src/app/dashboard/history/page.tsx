'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function HistoryPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [filter, setFilter] = useState({ area: '', technician: '' })

  const AREAS = ['', 'M-1 Furnace', 'M-2 Furnace', 'Reformer Area', 'DRI Handling Area', 'Utilities']

  useEffect(() => { fetchHistory() }, [filter])

  const fetchHistory = async () => {
    const params = new URLSearchParams()
    if (filter.area) params.set('area', filter.area)
    if (filter.technician) params.set('technician', filter.technician)
    const res = await fetch(`/api/activities?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) setActivities(data)
  }

  return (
    <DashboardLayout title="Maintenance History" subtitle="Complete record of all maintenance activities">
      <div className="card" style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: '180px' }} value={filter.area} onChange={e => setFilter({...filter, area: e.target.value})}>
          <option value="">All Areas</option>
          {AREAS.filter(Boolean).map(a => <option key={a}>{a}</option>)}
        </select>
        <input className="form-input" style={{ width: '180px' }} placeholder="Filter by technician..." value={filter.technician} onChange={e => setFilter({...filter, technician: e.target.value})} />
        <button className="btn btn-secondary btn-sm" onClick={fetchHistory}>🔄 Filter</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '13px', alignSelf: 'center' }}>{activities.length} records</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📜</div>
            No maintenance history records yet.
          </div>
        ) : activities.map(a => (
          <div key={a.id} className="card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span className="tag" style={{ marginRight: '8px' }}>{a.tagNumber || 'NO-TAG'}</span>
                <strong style={{ fontSize: '14px' }}>{a.equipmentName}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(a.completedAt).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{a.technicianName}</div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span className="badge badge-gray" style={{ marginRight: '8px' }}>{a.area}</span>
              {a.description}
            </div>
            {((a as any).beforeImageUrl || (a as any).afterImageUrl) && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                {(a as any).beforeImageUrl && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent-amber)', fontWeight: 600, marginBottom: '4px' }}>🟡 BEFORE</div>
                    <img src={(a as any).beforeImageUrl} alt="before" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)' }} onClick={() => window.open((a as any).beforeImageUrl)} />
                  </div>
                )}
                {(a as any).afterImageUrl && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '4px' }}>🟢 AFTER</div>
                    <img src={(a as any).afterImageUrl} alt="after" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)' }} onClick={() => window.open((a as any).afterImageUrl)} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
