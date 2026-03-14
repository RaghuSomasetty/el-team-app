'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function GalleryPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [filter, setFilter] = useState({ area: '', tag: '' })
  const [selected, setSelected] = useState<any>(null)

  const AREAS = ['', 'M-1 Furnace', 'M-2 Furnace', 'Reformer Area', 'DRI Handling Area', 'Utilities']

  useEffect(() => { fetchActivities() }, [filter])

  const fetchActivities = async () => {
    const params = new URLSearchParams()
    if (filter.area) params.set('area', filter.area)
    if (filter.tag) params.set('tag', filter.tag)
    const res = await fetch(`/api/activities?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) setActivities(data)
  }

  const withImages = activities.filter(a => a.beforeImageUrl || a.afterImageUrl)

  return (
    <DashboardLayout title="Maintenance Gallery" subtitle="Before/after photo comparison">
      <div className="card" style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: '180px' }} value={filter.area} onChange={e => setFilter({...filter, area: e.target.value})}>
          <option value="">All Areas</option>
          {AREAS.filter(Boolean).map(a => <option key={a}>{a}</option>)}
        </select>
        <input className="form-input" style={{ width: '180px' }} placeholder="Filter by tag..." value={filter.tag} onChange={e => setFilter({...filter, tag: e.target.value})} />
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '13px', alignSelf: 'center' }}>{withImages.length} photos</span>
      </div>

      {withImages.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🖼️</div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>No photos yet</h3>
          <p style={{ fontSize: '13px' }}>Upload maintenance activities with before/after photos to see them here.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {withImages.map(a => (
            <div key={a.id} className="gallery-item" onClick={() => setSelected(a)}>
              {a.beforeImageUrl ? (
                <img src={a.beforeImageUrl.startsWith('data:') ? a.beforeImageUrl : '/placeholder-maintenance.jpg'} alt="before" />
              ) : (
                <div style={{ height: '160px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>📷</div>
              )}
              <div className="gallery-info">
                <div className="gallery-tag">{a.tagNumber || 'NO-TAG'}</div>
                <div className="gallery-desc">{a.equipmentName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {a.technicianName} • {new Date(a.completedAt).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {a.beforeImageUrl && <span className="badge badge-amber" style={{ fontSize: '10px', padding: '2px 6px' }}>Before</span>}
                  {a.afterImageUrl && <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 6px' }}>After</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🖼️ {selected.equipmentName} <span className="tag" style={{ marginLeft: '8px' }}>{selected.tagNumber}</span></h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="grid-2">
              {selected.beforeImageUrl ? (
                <div><div style={{ fontSize: '12px', color: 'var(--accent-amber)', fontWeight: 600, marginBottom: '6px' }}>🟡 Before</div><img src={selected.beforeImageUrl} alt="before" style={{ width: '100%', borderRadius: '8px' }} /></div>
              ) : <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-muted)' }}>No before photo</div>}
              {selected.afterImageUrl ? (
                <div><div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '6px' }}>🟢 After</div><img src={selected.afterImageUrl} alt="after" style={{ width: '100%', borderRadius: '8px' }} /></div>
              ) : <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-muted)' }}>No after photo</div>}
            </div>
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <strong>Area:</strong> {selected.area} &nbsp;|&nbsp; <strong>Technician:</strong> {selected.technicianName} &nbsp;|&nbsp; <strong>Date:</strong> {new Date(selected.completedAt).toLocaleString()}
              <div style={{ marginTop: '8px' }}>{selected.description}</div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
