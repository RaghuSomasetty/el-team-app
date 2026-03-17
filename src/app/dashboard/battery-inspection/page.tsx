'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'
import { motion } from 'framer-motion'

export default function BatteryInspectionDashboard() {
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/battery-inspections')
      .then(res => res.json())
      .then(data => {
        setInspections(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const latest = inspections[0]
  const stats = {
    total: latest?.totalBatteries || 0,
    healthy: latest?.healthyCount || 0,
    warning: latest?.warningCount || 0,
    critical: latest?.criticalCount || 0
  }

  return (
    <DashboardLayout title="Battery Health Dashboard" subtitle="Monitoring plant DC power systems">
      <div className="flex justify-end mb-6">
        <Link href="/dashboard/battery-inspection/new">
          <button className="btn btn-primary shadow-lg shadow-blue-500/20">
            ➕ New Inspection
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Batteries', value: stats.total, color: 'var(--accent-blue)', icon: '🔋' },
          { label: 'Healthy', value: stats.healthy, color: '#10b981', icon: '✅' },
          { label: 'Warning', value: stats.warning, color: '#f59e0b', icon: '⚠️' },
          { label: 'Critical', value: stats.critical, color: '#ef4444', icon: '🚨' }
        ].map((s, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="card text-center relative overflow-hidden group">
              <div 
                className="absolute top-0 right-0 w-16 h-16 opacity-5 flex items-center justify-center text-4xl transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"
                style={{ color: s.color }}
              >
                {s.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>
                {s.value}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Inspection History</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 50 records</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading records...</p>
          </div>
        ) : inspections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No inspections found. Start by adding one!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>DATE</th>
                  <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>INSPECTOR</th>
                  <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>HEALTH</th>
                  <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins, i) => (
                  <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover:bg-white/[0.02]">
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{new Date(ins.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ins.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px' }}>{ins.inspectorName}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', background: '#ef444420', color: '#ef4444' }}>{ins.criticalCount}C</span>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', background: '#f59e0b20', color: '#f59e0b' }}>{ins.warningCount}W</span>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', background: '#10b98120', color: '#10b981' }}>{ins.healthyCount}H</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <Link href={`/dashboard/battery-inspection/${ins.id}`}>
                        <button className="btn btn-sm btn-outline" style={{ fontSize: '11px' }}>View Report</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
