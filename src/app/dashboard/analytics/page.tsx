'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, Legend } from 'recharts'

const MOCK_FAILURES = [
  { motor: '12.01 - Shaft Fan', failures: 5, area: 'M-1 Furnace' },
  { motor: '24.04.04 - Air Fan', failures: 3, area: 'M-2 Furnace' },
  { motor: '21.68 - Pump', failures: 3, area: 'Utilities' },
  { motor: '15.02 - Blower', failures: 2, area: 'Reformer' },
  { motor: '08.11 - Conv.', failures: 2, area: 'DRI Handling' },
]

const RADAR_DATA = [
  { area: 'M-1 Furnace', value: 85 },
  { area: 'M-2 Furnace', value: 62 },
  { area: 'Reformer', value: 48 },
  { area: 'DRI Handling', value: 55 },
  { area: 'Utilities', value: 30 },
]

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [inspections, setInspections] = useState<any[]>([])
  const [motors, setMotors] = useState<any[]>([])
  const [trendCat, setTrendCat] = useState('10kV')
  const [selectedMotorTag, setSelectedMotorTag] = useState('')
  const [motorInspections, setMotorInspections] = useState<any[]>([])
  const [loadingMotorData, setLoadingMotorData] = useState(false)

  useEffect(() => {
    fetch('/api/reports/monthly').then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/inspections?limit=100').then(r => r.json()).then(setInspections).catch(() => {})
    fetch('/api/motors').then(r => r.json()).then(setMotors).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedMotorTag) {
      setLoadingMotorData(true)
      fetch(`/api/inspections?motorTag=${selectedMotorTag}&limit=20`)
        .then(r => r.json())
        .then(data => {
          setMotorInspections(Array.isArray(data) ? data.reverse() : [])
          setLoadingMotorData(false)
        })
        .catch(() => setLoadingMotorData(false))
    } else {
      setMotorInspections([])
    }
  }, [selectedMotorTag])

  // Reset selected motor when category changes
  useEffect(() => {
    setSelectedMotorTag('')
  }, [trendCat])

  const filteredMotors = motors.filter(m => {
    const v = m.voltage?.toLowerCase() || ''
    if (trendCat === '10kV') return v.includes('10') || v.includes('6.6')
    if (trendCat === '3kV') return v.includes('3')
    if (trendCat === 'LT') return v.includes('v') || v.includes('415') || v.includes('380')
    return false
  })
  
  const chartData = motorInspections.map(i => ({
    ...i,
    date: new Date(i.inspectedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    avgCurrent: ((i.currentR || 0) + (i.currentY || 0) + (i.currentB || 0)) / 3
  }))

  const aiAnalysis = () => {
    if (!selectedMotorTag || motorInspections.length === 0) return null
    const latest = motorInspections[motorInspections.length - 1]
    const r = latest.currentR || 0
    const y = latest.currentY || 0
    const b = latest.currentB || 0
    const avg = (r + y + b) / 3
    
    const maxVal = Math.max(r, y, b)
    const minVal = Math.min(r, y, b)
    const deviation = maxVal - minVal
    const imbalancePct = avg > 0 ? (deviation / avg) * 100 : 0

    let status = 'Normal'
    let recommendation = 'Continue monitoring.'
    let observation = `Motor: ${selectedMotorTag} | Avg Current: ${avg.toFixed(1)}A | Max Deviation: ${deviation.toFixed(1)}A`
    
    if (imbalancePct > 10) {
      status = 'Warning'
      recommendation = 'Phase current imbalance detected (>10%). Possible causes: Bearing problem, Mechanical overload, or Cable issue.'
    }

    return { status, recommendation, observation, avg, deviation }
  }

  const aiResult = aiAnalysis()
  const abnormalMotors = inspections.filter(i => i.abnormality?.includes('[AI ALERT:'))

  return (
    <DashboardLayout title="Predictive Analytics" subtitle="Maintenance trend analysis and AI-driven alerts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Alerts Section */}
        {abnormalMotors.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', fontSize: '13px', marginBottom: '16px', letterSpacing: '0.05em' }}>
              <span>🚨 CRITICAL MOTOR ALERTS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
              {abnormalMotors.slice(0, 3).map(m => (
                <div key={m.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{m.motorTag} — {m.area}</div>
                  <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{m.abnormality?.split(']')[0].replace('[AI ALERT: ', '')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Motor Current Trends */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>📈 Motor-wise Current Trends</h3>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px' }}>
                  {['10kV', '3kV', 'LT'].map(cat => (
                    <button key={cat} onClick={() => setTrendCat(cat)} 
                      style={{ 
                        padding: '6px 16px', fontSize: '12px', borderRadius: '6px', fontWeight: 600,
                        background: trendCat === cat ? 'var(--accent-blue)' : 'transparent',
                        color: trendCat === cat ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Select Motor Tag</label>
                <select 
                  className="form-select" 
                  style={{ maxWidth: '400px', borderRadius: '12px' }}
                  value={selectedMotorTag}
                  onChange={(e) => setSelectedMotorTag(e.target.value)}
                >
                  <option value="">-- Choose a Motor --</option>
                  {filteredMotors.map(m => (
                    <option key={m.id} value={m.motorTag}>{m.motorTag} - {m.motorName}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ height: '350px' }}>
              {!selectedMotorTag ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                  <div style={{ fontSize: '40px' }}>🔍</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>Select a Motor Tag to view Current Trends</div>
                </div>
              ) : loadingMotorData ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner"></div>
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No historical data found for {selectedMotorTag}.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="A" axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="currentR" stroke="#ef4444" name="R Phase" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="currentY" stroke="#f59e0b" name="Y Phase" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="currentB" stroke="#3b82f6" name="B Phase" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="avgCurrent" stroke="#10b981" name="Average Current" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {aiResult && (
              <div style={{ marginTop: '32px', padding: '20px', borderRadius: '16px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 800, fontSize: '13px' }}>
                    <span>🤖 AI CURRENT ANALYSIS</span>
                  </div>
                  <span style={{ 
                    fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', 
                    background: aiResult.status === 'Normal' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: aiResult.status === 'Normal' ? '#10b981' : '#ef4444'
                  }}>
                    {aiResult.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>AI Observation:</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{aiResult.observation}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Recommendation:</div>
                    <div style={{ fontSize: '13px', color: aiResult.status === 'Normal' ? '#10b981' : '#f59e0b', fontWeight: 500 }}>
                      {aiResult.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plant Loading Breakdown */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>🔋 Plant Loading Breakdown (%)</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { cat: '10kV', load: Math.round(inspections.filter(i => i.category === '10kV').reduce((a, b) => a + (b.loadingPct || 0), 0) / (inspections.filter(i => i.category === '10kV').length || 1)) },
                  { cat: '3kV', load: Math.round(inspections.filter(i => i.category === '3kV').reduce((a, b) => a + (b.loadingPct || 0), 0) / (inspections.filter(i => i.category === '3kV').length || 1)) },
                  { cat: 'LT', load: Math.round(inspections.filter(i => i.category === 'LT').reduce((a, b) => a + (b.loadingPct || 0), 0) / (inspections.filter(i => i.category === 'LT').length || 1)) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" vertical={false} />
                  <XAxis dataKey="cat" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '12px' }} />
                  <Bar dataKey="load" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Loading %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>🏆 Recent Achievements</h3>
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Performance" dataKey="value" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </DashboardLayout>
  )
}
