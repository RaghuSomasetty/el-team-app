'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'
import { Plus, Calendar, User, Activity, ArrowRight } from 'lucide-react'

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
    <DashboardLayout title="Battery Health Dashboard" subtitle="Monitoring plant DC power systems history">
      <div className="flex justify-end mb-8">
        <Link href="/dashboard/battery-inspection/new">
          <button className="btn btn-primary shadow-lg shadow-blue-500/20 flex items-center gap-2 hover-glow" style={{ borderRadius: '14px', padding: '12px 24px', fontWeight: 700 }}>
            <Plus size={18} /> New Inspection
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Units', value: stats.total, color: '#3b82f6', icon: <Activity size={20} /> },
          { label: 'Healthy', value: stats.healthy, color: '#10b981', icon: <Activity size={20} /> },
          { label: 'Warning', value: stats.warning, color: '#f59e0b', icon: <Activity size={20} /> },
          { label: 'Critical', value: stats.critical, color: '#ef4444', icon: <Activity size={20} /> }
        ].map((s, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="glass-panel relative overflow-hidden group" style={{ borderRadius: '24px', padding: '24px', borderLeft: `4px solid ${s.color}` }}>
              <div 
                className="absolute top-0 right-0 w-20 h-20 opacity-5 flex items-center justify-center text-4xl transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"
                style={{ color: s.color }}
              >
                {s.icon}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: s.color }}>
                {s.value}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.4}>
        <div className="glass-panel relative overflow-hidden" style={{ borderRadius: '28px', padding: '32px' }}>
          <div className="grid-bg-subtle" style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', position: 'relative' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Inspection History</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing the latest 50 recorded assessments</p>
            </div>
            <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/10">
              Live Feed
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>Retrieving archive...</p>
            </div>
          ) : inspections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', background: 'rgba(255,255,255,0.01)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No historical records found. Deploy a new inspection to begin.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', position: 'relative' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Date & Sequence</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Inspector</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Health Profile</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((ins, i) => (
                    <tr key={ins.id} className="group transition-all">
                      <td style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px 0 0 16px', border: '1px solid rgba(255,255,255,0.05)', borderRight: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#3b82f6' }} className="flex justify-center items-center">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{new Date(ins.date).toLocaleDateString()}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ins.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', borderRight: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} className="text-slate-500" />
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{ins.inspectorName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', borderRight: 'none' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '10px', fontWeight: 800 }}>{ins.healthyCount}H</span>
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '10px', fontWeight: 800 }}>{ins.warningCount}W</span>
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '10px', fontWeight: 800 }}>{ins.criticalCount}C</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '0 16px 16px 0', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', textAlign: 'right' }}>
                        <Link href={`/dashboard/battery-inspection/${ins.id}`}>
                          <button className="btn btn-sm btn-outline hover-glow group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all flex items-center justify-center ml-auto" style={{ fontSize: '11px', fontWeight: 700, borderRadius: '10px', padding: '6px 16px', gap: '6px' }}>
                            View Report <ArrowRight size={12} />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>

      <style jsx global>{`
        .glass-panel {
          background: rgba(13, 17, 23, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        }
        .group:hover td {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(59, 130, 246, 0.2) !important;
        }
      `}</style>
    </DashboardLayout>
  )
}
