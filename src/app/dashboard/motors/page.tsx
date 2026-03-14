'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

const AREAS = ['M-1 Furnace', 'M-2 Furnace', 'Reformer Area', 'DRI Handling Area', 'Utilities', 'Substation', 'Control Room']

export default function MotorsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const [motors, setMotors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    motorTag: '', motorName: '', area: '', powerKw: '', voltage: '', rpm: '',
    manufacturer: '', driveEndBearing: '', nonDriveEndBearing: '', couplingType: '', installDate: '',
  })

  // Debounce: only fetch 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => { fetchMotors() }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchMotors = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('tag', search)
    const res = await fetch(`/api/motors?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) setMotors(data)
  }, [search])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, powerKw: parseFloat(form.powerKw), rpm: parseInt(form.rpm) }
    const res = await fetch('/api/motors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { setShowForm(false); fetchMotors() }
  }

  const handleImport = async (file: File) => {
    if (!file) return
    setImporting(true)
    setImportResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/motors/import', { method: 'POST', body: fd })
      const result = await res.json()
      setImportResult(result)
      if (result.success) fetchMotors()
    } catch {
      setImportResult({ error: 'Upload failed. Please try again.' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <DashboardLayout
      title="Motor Database"
      subtitle="Technical specifications of all motors"
      actions={(
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" id="import-motor-btn" onClick={() => { setShowImport(true); setImportResult(null) }}>📥 Import Excel</button>
          {user?.role === 'ENGINEER' && (
            <button className="btn btn-primary btn-sm" id="add-motor-btn" onClick={() => setShowForm(true)}>+ Add Motor</button>
          )}
        </div>
      )}
    >
      {/* Stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        {[
          { label: 'Total Motors', value: motors.length, icon: '⚙️', color: 'rgba(59,130,246,0.1)' },
          { label: 'Running', value: motors.filter(m => m.status === 'RUNNING').length, icon: '✅', color: 'rgba(16,185,129,0.1)' },
          { label: 'HV Motors (>11kV)', value: motors.filter(m => m.voltage?.includes('10') || m.voltage?.includes('11')).length, icon: '⚡', color: 'rgba(245,158,11,0.1)' },
          { label: '>500kW', value: motors.filter(m => m.powerKw >= 500).length, icon: '💪', color: 'rgba(139,92,246,0.1)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color, fontSize: '22px' }}>{k.icon}</div>
            <div className="kpi-info">
              <div className="kpi-value" style={{ fontSize: '24px' }}>{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <input type="search" className="search-bar" placeholder="🔍 Search by motor tag (e.g. 24.04.04)..." value={search} onChange={e => setSearch(e.target.value)} id="motor-search" />
        <button className="btn btn-secondary btn-sm" onClick={fetchMotors}>Search</button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Motor Tag</th><th>Motor Name</th><th>Area</th><th>Power (kW)</th>
              <th>Voltage</th><th>RPM</th><th>DE Bearing</th><th>NDE Bearing</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {motors.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No motors found. {user?.role === 'ENGINEER' && <span onClick={() => setShowForm(true)} style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Add one →</span>}
              </td></tr>
            ) : motors.map(m => (
              <tr key={m.id} onClick={() => router.push(`/dashboard/motors/${encodeURIComponent(m.motorTag)}`)} style={{ cursor: 'pointer' }}>
                <td><span className="tag">{m.motorTag}</span></td>
                <td style={{ fontWeight: 600 }}>{m.motorName}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.area}</td>
                <td>{m.powerKw} kW</td>
                <td>{m.voltage}</td>
                <td>{m.rpm.toLocaleString()}</td>
                <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{m.driveEndBearing || '—'}</td>
                <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{m.nonDriveEndBearing || '—'}</td>
                <td><span className={`badge ${m.status === 'RUNNING' ? 'badge-green' : 'badge-red'}`}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Add Motor Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⚙️ Add Motor</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Motor Tag</label><input className="form-input" placeholder="24.04.04" value={form.motorTag} onChange={e => setForm({...form, motorTag: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Motor Name</label><input className="form-input" placeholder="Main Air Fan" value={form.motorName} onChange={e => setForm({...form, motorName: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Area</label>
                  <select className="form-select" value={form.area} onChange={e => setForm({...form, area: e.target.value})} required>
                    <option value="">Select...</option>{AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Power (kW)</label><input type="number" className="form-input" placeholder="500" value={form.powerKw} onChange={e => setForm({...form, powerKw: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Voltage</label><input className="form-input" placeholder="10 kV" value={form.voltage} onChange={e => setForm({...form, voltage: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">RPM</label><input type="number" className="form-input" placeholder="1480" value={form.rpm} onChange={e => setForm({...form, rpm: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Manufacturer</label><input className="form-input" placeholder="ABB / Siemens" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Coupling Type</label><input className="form-input" placeholder="Flexible" value={form.couplingType} onChange={e => setForm({...form, couplingType: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">DE Bearing</label><input className="form-input" placeholder="6316 C3" value={form.driveEndBearing} onChange={e => setForm({...form, driveEndBearing: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">NDE Bearing</label><input className="form-input" placeholder="6314 C3" value={form.nonDriveEndBearing} onChange={e => setForm({...form, nonDriveEndBearing: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="motor-save-btn">💾 Save Motor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📥 Import Motors from Excel</h3>
              <button className="modal-close" onClick={() => setShowImport(false)}>✕</button>
            </div>

            {/* Column guide */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Excel Columns</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', color: 'var(--text-secondary)' }}>
                {[
                  ['Motor Tag', 'tag / motor tag'],
                  ['Motor Name', 'name / motor name'],
                  ['Area', 'area / location'],
                  ['Power (kW)', 'power / kw / power kw'],
                  ['Voltage', 'voltage / rated voltage'],
                  ['RPM', 'rpm / speed'],
                ].map(([field, aliases]) => (
                  <div key={field}><span style={{ color: 'var(--accent-cyan)' }}>✓</span> {field} <span style={{ opacity: 0.5 }}>({aliases})</span></div>
                ))}
              </div>
              <div style={{ marginTop: '8px', opacity: 0.6 }}>Optional: Manufacturer, DE Bearing, NDE Bearing, Coupling, Status</div>
            </div>

            {/* Drop zone */}
            <div
              style={{
                border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '32px',
                textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
                background: 'var(--bg-secondary)',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImport(f) }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {importing ? '⏳ Importing...' : 'Drop your Excel file here or click to browse'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>.xlsx or .xls files supported</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }}
              />
            </div>

            {/* Result */}
            {importResult && (
              <div style={{ marginTop: '16px', borderRadius: '10px', padding: '14px', background: importResult.error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${importResult.error ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                {importResult.error ? (
                  <div style={{ color: '#ef4444' }}>❌ {importResult.error}</div>
                ) : (
                  <>
                    <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '8px' }}>✅ Import Complete — {importResult.total} rows processed</div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                      <span style={{ color: '#3b82f6' }}>➕ {importResult.inserted} inserted</span>
                      <span style={{ color: '#f59e0b' }}>🔄 {importResult.updated} updated</span>
                      <span style={{ color: '#ef4444' }}>⚠️ {importResult.skipped} skipped</span>
                    </div>
                    {importResult.errors?.length > 0 && (
                      <div style={{ marginTop: '10px', fontSize: '11px', color: '#ef4444', maxHeight: '100px', overflowY: 'auto' }}>
                        {importResult.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowImport(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
