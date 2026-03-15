'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useSession } from 'next-auth/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import { exportMotorHistoryToPDF, exportMotorHistoryToExcel } from '@/lib/exportUtils'

type Category = '10kV' | '3kV' | 'LT'
type Motor = {
  id: string; motorTag: string; motorName: string; area: string
  powerKw: number; voltage: string; rpm: number; manufacturer: string | null
}
type Inspection = {
  id: string; motorTag: string; motorName: string; currentR: number | null
  currentY: number | null; currentB: number | null; ratedCurrent: number | null
  loadingPct: number | null; abnormality: string | null; inspectedBy: string
  shift: string; inspectedAt: string
}

const SHIFTS = ['General', 'A', 'B', 'C']
const CAT_VOLTAGE: Record<Category, string> = { '10kV': '10 kV', '3kV': '3 kV', 'LT': '380 V' }
const CAT_COLORS: Record<Category, string> = { '10kV': '#ef4444', '3kV': '#f59e0b', 'LT': '#3b82f6' }

// Approximate rated current from kW + voltage
function approxCurrent(kw: number, voltage: string): number {
  const v = parseFloat(voltage.replace(/[^0-9.]/g, ''))
  const voltV = voltage.toLowerCase().includes('kv') ? v * 1000 : v
  return Math.round((kw * 1000) / (Math.sqrt(3) * voltV * 0.87 * 0.92))
}

function LoadingBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const color = pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981'
  return <span style={{ color, fontWeight: 700 }}>{pct}%</span>
}

function AbnormalityBadge({ text }: { text: string | null }) {
  if (!text) return <span style={{ color: '#10b981', fontSize: '11px' }}>✓ Normal</span>
  return <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>⚠ {text}</span>
}

export default function InspectionsPage() {
  const [activeTab, setActiveTab] = useState<Category>('10kV')
  const [allMotors, setAllMotors] = useState<Motor[]>([])
  const [motors, setMotors] = useState<Motor[]>([]) // Currently visible motors for the tab
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null)
  const { data: session } = useSession()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ 
    currentR: '', 
    currentY: '', 
    currentB: '', 
    abnormality: '', 
    inspectedBy: '', 
    shift: 'General' 
  })
  const detailRef = useRef<HTMLDivElement>(null)

  // Helper to determine category from voltage
  const getCategory = (voltage: string): Category => {
    const v = voltage?.toLowerCase() || ''
    if (v.includes('10 kv') || v.includes('10kv')) return '10kV'
    if (v.includes('3 kv') || v.includes('3kv')) return '3kV'
    return 'LT'
  }

  // Fetch all motors once
  useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch('/api/motors')
      if (res.ok) setAllMotors(await res.json())
    }
    fetchAll()
  }, [])

  // Sync default name from session
  useEffect(() => {
    const userName = session?.user?.name
    if (userName && !form.inspectedBy) {
      setForm(f => ({ ...f, inspectedBy: userName }))
    }
  }, [session, form.inspectedBy])

  // Filter motors based on tab OR search
  useEffect(() => {
    if (search.trim()) {
      // Global search across all categories
      const filtered = allMotors.filter(m =>
        m.motorTag.toLowerCase().includes(search.toLowerCase()) ||
        m.motorName.toLowerCase().includes(search.toLowerCase()) ||
        m.area.toLowerCase().includes(search.toLowerCase())
      )
      setMotors(filtered)
    } else {
      // Filter by active tab
      const filtered = allMotors.filter(m => getCategory(m.voltage) === activeTab)
      setMotors(filtered)
    }
  }, [allMotors, activeTab, search])

  // Fetch inspections for selected motor
  const loadInspections = useCallback(async (tag: string) => {
    const res = await fetch(`/api/inspections?motorTag=${encodeURIComponent(tag)}&limit=30`)
    if (res.ok) setInspections(await res.json())
  }, [])

  const selectMotor = (m: Motor) => {
    // If searching globally, switch tab to the motor's category for consistency
    const cat = getCategory(m.voltage)
    if (cat !== activeTab) {
      setActiveTab(cat)
    }
    
    setSelectedMotor(m)
    setInspections([])
    loadInspections(m.motorTag)
    setForm(f => ({ ...f, currentR: '', currentY: '', currentB: '', abnormality: '' }))

    // Auto-scroll to detail on mobile/tablet
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }


  const [exporting, setExporting] = useState(false)

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!selectedMotor) return
    setExporting(true)
    try {
      const res = await fetch(`/api/reports/motor-history?motorTag=${encodeURIComponent(selectedMotor.motorTag)}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      
      if (!Array.isArray(data)) throw new Error('Invalid data format received from API')

      if (type === 'pdf') {
        exportMotorHistoryToPDF(selectedMotor, data)
      } else {
        exportMotorHistoryToExcel(selectedMotor, data)
      }
    } catch (err: any) {
      console.error(`${type} Export Error:`, err)
      alert(`Failed to generate ${type.toUpperCase()}: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMotor || !form.inspectedBy.trim()) return
    setSaving(true)
    const rated = approxCurrent(selectedMotor.powerKw, selectedMotor.voltage)
    const res = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motorTag: selectedMotor.motorTag,
        motorName: selectedMotor.motorName,
        area: selectedMotor.area,
        category: getCategory(selectedMotor.voltage),
        currentR: form.currentR || null,
        currentY: form.currentY || null,
        currentB: form.currentB || null,
        ratedCurrent: rated,
        abnormality: form.abnormality || null,
        inspectedBy: form.inspectedBy,
        shift: form.shift,
      }),
    })
    if (res.ok) {
      setForm(f => ({ ...f, currentR: '', currentY: '', currentB: '', abnormality: '' }))
      await loadInspections(selectedMotor.motorTag)
    }
    setSaving(false)
  }

  const filtered = motors // Use the already filtered state

  // Build chart data from inspections
  const chartData = [...inspections].reverse().map(r => ({
    time: new Date(r.inspectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
      ' ' + new Date(r.inspectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    R: r.currentR,
    Y: r.currentY,
    B: r.currentB,
    Loading: r.loadingPct,
  }))

  const tabColor = CAT_COLORS[activeTab]

  return (
    <DashboardLayout title="Motor Inspection" subtitle="Current readings & abnormality tracking">
      {/* Category Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px', 
        overflowX: 'auto', 
        paddingBottom: '8px',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }} className="no-scrollbar">
        {(['10kV', '3kV', 'LT'] as Category[]).map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={activeTab === cat ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontWeight: 700, borderColor: activeTab === cat ? CAT_COLORS[cat] : undefined, fontSize: '13px', padding: '8px 20px', whiteSpace: 'nowrap' }}>
            {cat === '10kV' ? '⚡ 10kV Motors' : cat === '3kV' ? '🔆 3kV Motors' : '🔌 LT Motors'}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
        {motors.length} motors found
      </div>

      <div className="grid-sidebar-layout">

        {/* Left: Motor List */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <input type="text" className="search-bar" placeholder="Search tag, name, area..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} />
          </div>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No motors found</div>
            ) : filtered.map(m => (
              <div key={m.id} onClick={() => selectMotor(m)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                  background: selectedMotor?.motorTag === m.motorTag ? `rgba(${tabColor === '#ef4444' ? '239,68,68' : tabColor === '#f59e0b' ? '245,158,11' : '59,130,246'},0.12)` : 'transparent',
                  borderLeft: selectedMotor?.motorTag === m.motorTag ? `3px solid ${tabColor}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{m.motorTag}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.motorName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{m.area} · {m.powerKw} kW</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div ref={detailRef} style={{ scrollMarginTop: '80px' }}>
          {!selectedMotor ? (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)', padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚡</div>
              <div style={{ fontWeight: 600 }}>Select a motor from the list</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>to enter current readings and view trends</div>
            </div>
          ) : (
            <>
              {/* Back button for mobile */}
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ⬅ Back to Motor List
              </button>

              {/* Motor Info Header */}
              <div style={{ background: `linear-gradient(135deg, rgba(${tabColor === '#ef4444' ? '239,68,68' : tabColor === '#f59e0b' ? '245,158,11' : '59,130,246'},0.12), rgba(0,0,0,0))`, borderRadius: '12px', border: `1px solid ${tabColor}40`, padding: '16px 20px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedMotor.motorTag}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedMotor.motorName}</div>
                </div>
                {[
                  ['Area', selectedMotor.area],
                  ['Power', `${selectedMotor.powerKw} kW`],
                  ['Voltage', selectedMotor.voltage],
                  ['RPM', selectedMotor.rpm],
                  ['Rated Current', `~${approxCurrent(selectedMotor.powerKw, selectedMotor.voltage)} A`],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: tabColor }}>{v}</div>
                  </div>
                ))}
                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', gridColumn: '1 / -1', marginTop: '4px' }}>
                  <button onClick={e => { e.preventDefault(); handleExport('pdf'); }} disabled={exporting} 
                    className="btn btn-secondary btn-sm" style={{ borderColor: '#ef444460', color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {exporting ? '⏳...' : '📄 Download PDF Report'}
                  </button>
                  <button onClick={e => { e.preventDefault(); handleExport('excel'); }} disabled={exporting}
                    className="btn btn-secondary btn-sm" style={{ borderColor: '#10b98160', color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {exporting ? '⏳...' : '📊 Excel History Export'}
                  </button>
                </div>
              </div>

              {/* Entry Form */}
              <form onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px 20px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, marginBottom: '14px', fontSize: '14px' }}>📋 Enter Current Reading</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  {(['R', 'Y', 'B'] as const).map((ph, idx) => (
                    <div key={ph}>
                      <label className="form-label" style={{ color: ['#ef4444', '#f59e0b', '#3b82f6'][idx], fontSize: '11px' }}>{ph}-Ph Current (A)</label>
                      <input type="number" step="0.1" min="0" className="form-input"
                        placeholder={`${ph} phase`}
                        value={form[`current${ph}` as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [`current${ph}`]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">Technician Name *</label>
                    <input type="text" className="form-input" placeholder="Enter your name" required
                      value={form.inspectedBy} onChange={e => setForm(f => ({ ...f, inspectedBy: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Shift</label>
                    <select className="form-input" value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
                      {SHIFTS.map(s => <option key={s} value={s}>{s === 'General' ? 'General' : `Shift ${s}`}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Abnormality / Observations</label>
                  <textarea className="form-input" rows={5}
                    placeholder="e.g. High vibration on DE bearing, unusual noise, overheating... (leave blank if normal)"
                    value={form.abnormality} onChange={e => setForm(f => ({ ...f, abnormality: e.target.value }))}
                    style={{ resize: 'vertical', minHeight: '120px' }} />
                </div>


                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Saving...' : '✅ Submit Reading'}
                </button>
              </form>

              {/* Trend Chart */}
              {chartData.length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px 20px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '14px' }}>📈 Current Trend — {selectedMotor.motorTag}</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit=" A" width={50} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} A`]}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="R" stroke="#ef4444" dot={{ r: 3 }} strokeWidth={2} name="R-Phase (A)" connectNulls />
                      <Line type="monotone" dataKey="Y" stroke="#f59e0b" dot={{ r: 3 }} strokeWidth={2} name="Y-Phase (A)" connectNulls />
                      <Line type="monotone" dataKey="B" stroke="#3b82f6" dot={{ r: 3 }} strokeWidth={2} name="B-Phase (A)" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Rated current reference line note */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                    Rated current: ~{approxCurrent(selectedMotor.powerKw, selectedMotor.voltage)} A — stay below 100% loading
                  </div>
                </div>
              )}

              {/* Recent Entries Table */}
              {inspections.length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '13px' }}>
                    🕒 Inspection History ({inspections.length} records)
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date & Shift</th>
                          <th>R (A)</th>
                          <th>Y (A)</th>
                          <th>B (A)</th>
                          <th>Loading</th>
                          <th>Abnormality</th>
                          <th>Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections.map(r => (
                          <tr key={r.id} style={{ background: r.abnormality ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '12px' }}>{new Date(r.inspectedAt).toLocaleDateString('en-IN')}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(r.inspectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {r.shift} shift</div>
                            </td>
                            <td style={{ color: '#ef4444', fontWeight: 600 }}>{r.currentR ?? '—'}</td>
                            <td style={{ color: '#f59e0b', fontWeight: 600 }}>{r.currentY ?? '—'}</td>
                            <td style={{ color: '#3b82f6', fontWeight: 600 }}>{r.currentB ?? '—'}</td>
                            <td><LoadingBadge pct={r.loadingPct} /></td>
                            <td><AbnormalityBadge text={r.abnormality} /></td>
                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.inspectedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {inspections.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '13px' }}>
                  No inspection records yet for {selectedMotor.motorTag}. Submit the first reading above ↑
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
