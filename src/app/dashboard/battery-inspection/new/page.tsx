'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'

type Reading = {
  section: string
  batteryNumber: number
  voltage: string
  specificGravity?: string
}

const SECTIONS = [
  { id: '110V_DC', name: 'SECTION 1: 110V DC BATTERY BANK', cells: 58, hasGravity: false },
  { id: 'UPS', name: 'SECTION 2: UPS SYSTEM BATTERY', cells: 30, hasGravity: false }, 
  { id: 'MODULE_1_OLD', name: 'SECTION 3: MODULE-1 24V OLD BATTERY', cells: 12, hasGravity: true },
  { id: 'MODULE_2_OLD', name: 'SECTION 4: MODULE-2 24V OLD BATTERY', cells: 12, hasGravity: true },
  { id: 'MODULE_1_NEW', name: 'SECTION 5: MODULE-1 24V NEW BATTERY', cells: 12, hasGravity: false },
  { id: 'MODULE_2_NEW', name: 'SECTION 6: MODULE-2 24V NEW BATTERY', cells: 12, hasGravity: false },
  { id: 'DG_SYSTEM', name: 'SECTION 7: DG SYSTEM BATTERY', cells: 2, hasGravity: false },
]

export default function NewBatteryInspectionPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [inspectorName, setInspectorName] = useState(session?.user?.name || '')
  const [observations, setObservations] = useState('')
  const [readings, setReadings] = useState<Reading[]>([])

  useEffect(() => {
    const initial: Reading[] = []
    SECTIONS.forEach(sec => {
      for (let i = 1; i <= sec.cells; i++) {
        initial.push({
          section: sec.id,
          batteryNumber: i,
          voltage: '',
          specificGravity: sec.hasGravity ? '' : undefined
        })
      }
    })
    setReadings(initial)
  }, [])

  const updateReading = (section: string, num: number, field: keyof Reading, value: string) => {
    setReadings(prev => prev.map(r => 
      (r.section === section && r.batteryNumber === num) ? { ...r, [field]: value } : r
    ))
  }

  const stats110V = useMemo(() => {
    const v110 = readings.filter(r => r.section === '110V_DC' && r.voltage !== '').map(r => parseFloat(r.voltage))
    if (v110.length === 0) return { total: '0.0', avg: '0.00', min: '0.00', max: '0.00' }
    const total = v110.reduce((a, b) => a + b, 0)
    return {
      total: total.toFixed(1),
      avg: (total / v110.length).toFixed(2),
      min: Math.min(...v110).toFixed(2),
      max: Math.max(...v110).toFixed(2)
    }
  }, [readings])

  const healthStats = useMemo(() => {
    let healthy = 0, warning = 0, critical = 0
    readings.forEach(r => {
      if (r.voltage === '') return
      const v = parseFloat(r.voltage)
      if (v < 2.05) critical++
      else if (v <= 2.14) warning++
      else if (v >= 2.15 && v <= 2.30) healthy++
      
      if (r.specificGravity && r.specificGravity !== '') {
        if (parseFloat(r.specificGravity) < 1.18) critical++
      }
    })
    return { healthy, warning, critical, total: healthy + warning + critical }
  }, [readings])

  const getVoltageStatus = (vStr: string) => {
    if (vStr === '') return 'normal'
    const v = parseFloat(vStr)
    if (v < 2.05) return 'critical'
    if (v <= 2.14) return 'warning'
    if (v >= 2.15 && v <= 2.30) return 'healthy'
    return 'normal'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspectorName) return alert('Please enter inspector name')
    
    setSaving(true)
    try {
      const processedReadings = readings.filter(r => r.voltage !== '').map(r => {
        const v = parseFloat(r.voltage)
        let status = 'NORMAL'
        if (v < 2.05) status = 'CRITICAL'
        else if (v <= 2.14) status = 'WARNING'
        
        if (r.specificGravity && parseFloat(r.specificGravity) < 1.18) status = 'CRITICAL'
        
        let isDeviationFlagged = false
        if (r.section === '110V_DC') {
          const avg = parseFloat(stats110V.avg)
          if (Math.abs(v - avg) > 0.15) isDeviationFlagged = true
        }

        return { ...r, status, isDeviationFlagged }
      })

      const res = await fetch('/api/battery-inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectorName,
          observations,
          totalVoltage_110V: parseFloat(String(stats110V.total)),
          averageVoltage_110V: parseFloat(String(stats110V.avg)),
          minVoltage_110V: parseFloat(String(stats110V.min)),
          maxVoltage_110V: parseFloat(String(stats110V.max)),
          totalBatteries: healthStats.total,
          healthyCount: healthStats.healthy,
          warningCount: healthStats.warning,
          criticalCount: healthStats.critical,
          readings: processedReadings,
          imageUrls: []
        })
      })

      if (res.ok) {
        router.push('/dashboard/battery-inspection')
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      alert('Error saving inspection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="New Battery Inspection" subtitle="Digital entry form for plant batteries">
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label className="form-label">Inspector Name</label>
              <input type="text" className="form-input" value={inspectorName} onChange={e => setInspectorName(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="text" className="form-input" value={new Date().toLocaleDateString('en-IN')} disabled />
            </div>
          </div>
        </div>

        <div style={{ 
          position: 'sticky', top: '80px', zIndex: 10, 
          background: 'var(--bg-card)', padding: '12px 20px', borderRadius: '12px',
          border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '13px' }}>110V Total: <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{stats110V.total}V</span></div>
            <div style={{ fontSize: '13px' }}>110V Avg: <span style={{ fontWeight: 700, color: '#10b981' }}>{stats110V.avg}V</span></div>
            <div style={{ fontSize: '13px' }}>Warnings: <span style={{ fontWeight: 700, color: '#f59e0b' }}>{healthStats.warning}</span></div>
            <div style={{ fontSize: '13px' }}>Critical: <span style={{ fontWeight: 700, color: '#ef4444' }}>{healthStats.critical}</span></div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? '⏳ Saving...' : '✅ Save Inspection'}
          </button>
        </div>

        {SECTIONS.map(section => (
          <FadeIn key={section.id}>
            <div className="card" style={{ marginBottom: '32px' }}>
              <div style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--accent-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {section.name}
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '12px' 
              }}>
                {readings.filter(r => r.section === section.id).map(r => {
                  const status = getVoltageStatus(r.voltage)
                  const borderColor = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : status === 'healthy' ? '#10b981' : 'var(--border-color)'
                  
                  return (
                    <div key={`${r.section}-${r.batteryNumber}`} style={{ 
                      padding: '10px', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      transition: 'border-color 0.2s'
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cell {r.batteryNumber}</div>
                      <input 
                        type="number" step="0.01" className="form-input" placeholder="Volts"
                        style={{ fontSize: '12px', padding: '6px', height: 'auto', marginBottom: section.hasGravity ? '6px' : '0' }}
                        value={r.voltage}
                        onChange={e => updateReading(section.id, r.batteryNumber, 'voltage', e.target.value)}
                      />
                      {section.hasGravity && (
                        <input 
                          type="number" step="0.001" className="form-input" placeholder="Gravity"
                          style={{ fontSize: '12px', padding: '6px', height: 'auto', color: r.specificGravity && parseFloat(r.specificGravity) < 1.18 ? '#ef4444' : 'inherit' }}
                          value={r.specificGravity}
                          onChange={e => updateReading(section.id, r.batteryNumber, 'specificGravity', e.target.value)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </FadeIn>
        ))}

        <div className="card" style={{ marginBottom: '40px' }}>
          <label className="form-label">General Observations & Recommendations</label>
          <textarea 
            className="form-input" rows={4} 
            placeholder="e.g. Needs equalizing charge, check terminals on cell 17..."
            value={observations}
            onChange={e => setObservations(e.target.value)}
          />
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '60px' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', maxWidth: '400px', height: '50px', fontSize: '16px' }} disabled={saving}>
            {saving ? '⏳ Saving Inspection...' : '✅ Complete & Save Inspection'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  )
}
