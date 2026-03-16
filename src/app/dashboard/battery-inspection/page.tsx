'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { exportBatteryInspectionToPDF } from '@/lib/exportUtils'

export default function BatteryDashboardPage() {
  const router = useRouter()
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    warning: 0,
    critical: 0
  })

  useEffect(() => {
    fetchInspections()
  }, [])

  const fetchInspections = async () => {
    try {
      const res = await fetch('/api/battery-inspections')
      if (res.ok) {
        const data = await res.json()
        setInspections(data)
        if (data.length > 0) {
          const latest = data[0]
          setStats({
            total: latest.totalBatteries,
            healthy: latest.healthyCount,
            warning: latest.warningCount,
            critical: latest.criticalCount
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch inspections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (inspection: any) => {
    try {
      const res = await fetch(`/api/battery-inspections/${inspection.id}`)
      if (res.ok) {
        const detail = await res.json()
        exportBatteryInspectionToPDF(detail, detail.readings)
      }
    } catch (err) {
      alert('Failed to generate report')
    }
  }

  const healthData = [
    { name: 'Healthy', value: stats.healthy, fill: '#10b981' },
    { name: 'Warning', value: stats.warning, fill: '#f59e0b' },
    { name: 'Critical', value: stats.critical, fill: '#ef4444' },
  ]

  return (
    <DashboardLayout title="Battery System Inspection" subtitle="Plant-wide DC & UPS battery health monitoring">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard/battery-inspection/new')}>
          ➕ Start New Inspection
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}><span className="spinner" /></div>
      ) : inspections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔋</div>
          <h3>No Inspections Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Digitize your first battery bank inspection today.</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => router.push('/dashboard/battery-inspection/new')}>
            Create First Inspection
          </button>
        </div>
      ) : (
        <>
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <FadeIn direction="left">
              <div className="card glass-panel" style={{ background: 'var(--bg-card)', padding: '24px' }}>
                <div style={{ fontWeight: 700, marginBottom: '20px', fontSize: '16px' }}>📊 Latest Health Status</div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1, height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={healthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {healthData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>{stats.total}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Cells</div>
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="card glass-panel" style={{ background: 'var(--bg-card)', padding: '24px' }}>
                <div style={{ fontWeight: 700, marginBottom: '20px', fontSize: '16px' }}>🔋 110V Bank Stats</div>
                <div className="grid-2" style={{ gap: '16px' }}>
                  {[
                    { label: 'Total Voltage', value: `${inspections[0].totalVoltage_110V || '—'} V`, color: 'var(--accent-blue)' },
                    { label: 'Avg Cell Voltage', value: `${inspections[0].averageVoltage_110V || '—'} V`, color: '#10b981' },
                    { label: 'Min Cell', value: `${inspections[0].minVoltage_110V || '—'} V`, color: '#ef4444' },
                    { label: 'Max Cell', value: `${inspections[0].maxVoltage_110V || '—'} V`, color: '#eab308' },
                  ].map(stat => (
                    <div key={stat.label} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.2}>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '16px' }}>🕒 Inspection History</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Inspector</th>
                      <th>Total Cells</th>
                      <th>Healthy</th>
                      <th>Warning</th>
                      <th>Critical</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map(ins => (
                      <tr key={ins.id}>
                        <td style={{ fontWeight: 600 }}>{new Date(ins.date).toLocaleDateString('en-IN')}</td>
                        <td>{ins.inspectorName}</td>
                        <td style={{ textAlign: 'center' }}>{ins.totalBatteries}</td>
                        <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{ins.healthyCount}</td>
                        <td style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{ins.warningCount}</td>
                        <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>{ins.criticalCount}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadReport(ins)}>📄 PDF</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/dashboard/battery-inspection/${ins.id}`)}>👁️ View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeIn>
        </>
      )}
    </DashboardLayout>
  )
}
