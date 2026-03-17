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
  { id: '110V_DC', name: 'SECTION 1: 110V DC BATTERY BANK', cells: 58, hasGravity: false, nominalVoltage: 110 },
  { id: 'UPS', name: 'SECTION 2: UPS SYSTEM BATTERY', cells: 18, hasGravity: false, nominalVoltage: 220 }, // 220V UPS system
  { id: 'MODULE_1_OLD', name: 'SECTION 3: MODULE-1 24V OLD BATTERY', cells: 20, hasGravity: true, nominalVoltage: 24 },
  { id: 'MODULE_2_OLD', name: 'SECTION 4: MODULE-2 24V OLD BATTERY', cells: 20, hasGravity: true, nominalVoltage: 24 },
  { id: 'MODULE_1_NEW', name: 'SECTION 5: MODULE-1 24V NEW BATTERY', cells: 14, hasGravity: false, nominalVoltage: 24 },
  { id: 'MODULE_2_NEW', name: 'SECTION 6: MODULE-2 24V NEW BATTERY', cells: 14, hasGravity: false, nominalVoltage: 24 },
  { id: 'DG_SYSTEM', name: 'SECTION 7: DG SYSTEM BATTERY', cells: 2, hasGravity: false, nominalVoltage: 24 }, // Assuming 24V DG
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

  const sectionStats = useMemo(() => {
    const stats: Record<string, { total: string, avg: string, min: string, max: string }> = {}
    SECTIONS.forEach(sec => {
      const vSec = readings.filter(r => r.section === sec.id && r.voltage !== '').map(r => parseFloat(r.voltage))
      if (vSec.length === 0) {
        stats[sec.id] = { total: '0.0', avg: '0.00', min: '0.00', max: '0.00' }
      } else {
        const total = vSec.reduce((a, b) => a + b, 0)
        stats[sec.id] = {
          total: total.toFixed(1),
          avg: (total / vSec.length).toFixed(2),
          min: Math.min(...vSec).toFixed(2),
          max: Math.max(...vSec).toFixed(2)
        }
      }
    })
    return stats
  }, [readings])

  const healthStats = useMemo(() => {
    let healthy = 0, warning = 0, critical = 0
    readings.forEach(r => {
      if (r.voltage === '') return
      const v = parseFloat(r.voltage)
      if (v < 2.05) critical++
      else if (v <= 2.14) warning++
      else if (v >= 2.15 && v <= 2.30) healthy++
      else {
        // Anything outside specified ranges? User only specified up to 2.30 as normal.
        // Let's assume > 2.30 is also healthy/normal unless specified otherwise,
        // but for now stick to the ranges.
        healthy++
      }
      
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
    if (v >= 2.05 && v <= 2.14) return 'warning'
    if (v >= 2.15 && v <= 2.30) return 'healthy'
    return 'normal'
  }

  const [images, setImages] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 800
          let width = img.width
          let height = img.height
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE }
          }
          canvas.width = width
          canvas.height = height
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
          setImages(prev => [...prev.slice(-3), canvas.toDataURL('image/jpeg', 0.7)]) // Keep last 4 images
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    })
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
        else if (v >= 2.15 && v <= 2.30) status = 'NORMAL'
        
        if (r.specificGravity && parseFloat(r.specificGravity) < 1.18) status = 'CRITICAL'
        
        let isDeviationFlagged = false
        if (r.section === '110V_DC') {
          const avg = parseFloat(sectionStats[r.section].avg)
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
          totalVoltage_110V: parseFloat(String(sectionStats['110V_DC'].total)),
          averageVoltage_110V: parseFloat(String(sectionStats['110V_DC'].avg)),
          minVoltage_110V: parseFloat(String(sectionStats['110V_DC'].min)),
          maxVoltage_110V: parseFloat(String(sectionStats['110V_DC'].max)),
          totalBatteries: healthStats.total,
          healthyCount: healthStats.healthy,
          warningCount: healthStats.warning,
          criticalCount: healthStats.critical,
          readings: processedReadings,
          imageUrls: images
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
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', overflowX: 'auto', maxWidth: '80%' }}>
            {SECTIONS.map(sec => (
              <div key={sec.id} style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                {sec.id.replace(/_/g, ' ')}: <span style={{ fontWeight: 700, color: parseFloat(sectionStats[sec.id].total) < (sec.nominalVoltage - 2) ? '#ef4444' : 'var(--accent-blue)' }}>{sectionStats[sec.id].total}V</span>
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? '⏳ Saving...' : '✅ Save Inspection'}
          </button>
        </div>

        {SECTIONS.map(section => (
          <FadeIn key={section.id}>
            <div className="card" style={{ marginBottom: '32px' }}>
              <div style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--accent-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{section.name}</span>
                <span style={{ fontSize: '14px' }}>Total: {sectionStats[section.id].total}V (Nominal: {section.nominalVoltage}V)</span>
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

        <div className="card" style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📸 Inspection Photos</span>
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>(Max 4 images)</span>
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent-blue)' }}>
                <img src={img} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  type="button" 
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label style={{ 
                width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed var(--border-color)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', fontSize: '24px'
              }}>
                ＋
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '40px' }}>
          <label className="form-label" style={{ fontWeight: 700 }}>AI Observations & Recommendations</label>
          <textarea 
            className="form-input" rows={4} 
            style={{ borderRadius: '12px', padding: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}
            placeholder="VoltMind AI will assist you once saved. Add initial observations here..."
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
