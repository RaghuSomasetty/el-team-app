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
  const [trendCat, setTrendCat] = useState('10kV')

  useEffect(() => {
    fetch('/api/reports/monthly').then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/inspections?limit=100').then(r => r.json()).then(setInspections).catch(() => {})
  }, [])

  const byWorkType = stats?.byWorkType || {}
  const workTypeData = Object.entries(byWorkType).map(([k, v]: any) => ({
    type: k, count: v.length
  }))

  const abnormalMotors = inspections.filter(i => i.abnormality?.includes('[AI ALERT:'))

  return (
    <DashboardLayout title="Predictive Analytics" subtitle="Maintenance trend analysis and AI-driven alerts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Alerts Section */}
        {abnormalMotors.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px 20px', animation: 'pulse-red 2s infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', fontSize: '14px', marginBottom: '12px' }}>
              <span>🚨 CRITICAL MOTOR ALERTS DETECTED</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {abnormalMotors.slice(0, 3).map(m => (
                <div key={m.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{m.motorTag} — {m.area}</div>
                  <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>{m.abnormality?.split(']')[0].replace('[AI ALERT: ', '')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Banner */}
        <div className="kpi-grid">
          {[
            { label: 'Total Logs (Month)', value: stats?.totalMIS || 0, icon: '📋', color: '#3b82f6' },
            { label: 'Technician Points', value: stats?.totalActivities || 0, icon: '🏆', color: '#10b981' },
            { label: 'Active Alerts', value: abnormalMotors.length, icon: '⚠️', color: '#ef4444' },
            { label: 'Avg Loading %', value: inspections.length ? Math.round(inspections.reduce((a, b) => a + (b.loadingPct || 0), 0) / inspections.length) + '%' : '0%', icon: '🚀', color: '#f59e0b' },
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

        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          {/* Motor Current Trends */}
          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="chart-title" style={{ margin: 0 }}>📈 Plant-wide Phase Current Trends</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['10kV', '3kV', 'LT'].map(cat => (
                  <button key={cat} onClick={() => setTrendCat(cat)} 
                    style={{ 
                      padding: '4px 12px', fontSize: '11px', borderRadius: '4px',
                      background: trendCat === cat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                      color: trendCat === cat ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid ' + (trendCat === cat ? 'var(--accent-blue)' : 'var(--border-color)')
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ height: '300px' }}>
              {inspections.filter(i => i.category === trendCat).length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No inspection data for {trendCat} yet. readings from "Motor Inspection" will appear here.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...inspections].filter(i => i.category === trendCat).reverse().slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                    <XAxis dataKey="motorTag" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="A" />
                    <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="currentR" stroke="#ef4444" name="R-Phase" dot={{ r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="currentY" stroke="#f59e0b" name="Y-Phase" dot={{ r: 4 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="currentB" stroke="#3b82f6" name="B-Phase" dot={{ r: 4 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Plant Loading Percentage Trend */}
          <div className="chart-card">
            <div className="chart-title">🔋 Plant Loading Breakdown (%)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { cat: '10kV', load: Math.round(inspections.filter(i => i.category === '10kV').reduce((a, b) => a + (b.loadingPct || 0), 0) / (inspections.filter(i => i.category === '10kV').length || 1)) },
                { cat: '3kV', load: Math.round(inspections.filter(i => i.category === '3kV').reduce((a, b) => a + (b.loadingPct || 0), 0) / (inspections.filter(i => i.category === '3kV').length || 1)) },
                { cat: 'LT', load: Math.round(inspections.filter(i => i.category === 'LT').reduce((a, b) => a + (b.loadingPct || 0), 0) / (inspections.filter(i => i.category === 'LT').length || 1)) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="cat" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="load" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Loading %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Predictive Recommendations */}
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <div className="chart-title" style={{ marginBottom: '16px' }}>🤖 AI Predictive Recommendations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {abnormalMotors.length > 0 ? abnormalMotors.map(m => (
                <div key={m.id} style={{ background: 'rgba(239,68,68,0.05)', borderRadius: '8px', padding: '12px 14px', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{m.motorTag}</div>
                    <span className="badge badge-red">CRITICAL</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Immediate inspection required: {m.abnormality?.split(']')[0].replace('[AI ALERT: ', '')}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  AI is monitoring all motors. No critical risks detected currently.
                </div>
              )}
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
