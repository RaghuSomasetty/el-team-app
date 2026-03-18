'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'
import { exportBatteryInspectionToPDF } from '@/lib/exportUtils'
import { History as HistoryIcon, ArrowUpRight, Activity, Gauge } from 'lucide-react'

export default function BatteryInspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [inspection, setInspection] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/battery-inspections/${id}`)
      .then(res => res.json())
      .then(data => {
        setInspection(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <DashboardLayout title="Loading..." subtitle="Fetching report details">
      <div className="flex flex-col items-center justify-center p-20">
        <div className="spinner"></div>
        <p className="mt-4 text-slate-400">Loading Report...</p>
      </div>
    </DashboardLayout>
  )

  if (!inspection) return (
    <DashboardLayout title="Error" subtitle="Report not found">
      <div className="card p-10 text-center text-slate-400">
        <p>This inspection report could not be found.</p>
        <Link href="/dashboard/battery-inspection" className="btn btn-outline mt-4">Back to Dashboard</Link>
      </div>
    </DashboardLayout>
  )

  const imageUrls = JSON.parse(inspection.imageUrls || '[]')
  
  const sections = [
    { id: '110V_DC', name: '110V DC BATTERY BANK' },
    { id: 'UPS', name: 'UPS SYSTEM BATTERY' },
    { id: 'MODULE_1_OLD', name: 'MODULE-1 24V OLD BATTERY' },
    { id: 'MODULE_2_OLD', name: 'MODULE-2 24V OLD BATTERY' },
    { id: 'MODULE_1_NEW', name: 'MODULE-1 24V NEW BATTERY' },
    { id: 'MODULE_2_NEW', name: 'MODULE-2 24V NEW BATTERY' },
    { id: 'DG_SYSTEM', name: 'DG SYSTEM BATTERY' },
  ]

  const generatePDF = () => {
    exportBatteryInspectionToPDF(inspection, inspection.readings)
  }

  return (
    <DashboardLayout title="Inspection Report" subtitle={`Recorded on ${new Date(inspection.date).toLocaleString()}`}>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className="btn btn-secondary btn-sm flex items-center gap-2 hover-glow"
          style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}
        >
          <HistoryIcon size={14} /> Back to History
        </button>
        <button 
          onClick={generatePDF} 
          className="btn btn-primary btn-sm flex items-center gap-2 hover-glow shadow-lg shadow-blue-500/20"
          style={{ borderRadius: '12px', fontWeight: 700 }}
        >
          <ArrowUpRight size={14} /> Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <FadeIn>
            <div className="glass-panel neon-border-blue relative overflow-hidden" style={{ borderRadius: '24px', padding: '28px' }}>
              <div className="grid-bg-subtle" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>VoltMind AI Analysis</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automated health assessment & predictive insights</p>
                </div>
                <div className="badge badge-blue" style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 900 }}>
                  <Activity size={12} style={{marginRight: '4px'}} /> AI ACTIVE
                </div>
              </div>

              <div className="space-y-4 relative">
                {inspection.aiAnalysis?.split(' | ').map((block: string, idx: number) => {
                  const [title, ...rest] = block.split('] ')
                  const sectionTitle = title.replace('[', '')
                  const content = rest.join('] ')
                  const recommendations = inspection.recommendations?.split(' | ')[idx] || ''

                  return (
                    <div key={idx} style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>{sectionTitle}</h4>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SEC-{idx+1}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '16px' }}>{content}</p>
                      
                      {recommendations && (
                        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '14px' }}>💡</span>
                          <p style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, lineHeight: '1.5' }}>
                            {recommendations.split(': ')[1] || recommendations}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="glass-panel" style={{ borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Technician Observations</h3>
              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.6' }}>
                "{inspection.observations || 'No additional observations recorded.'}"
              </div>
            </div>
          </FadeIn>
          
          {imageUrls.length > 0 && (
            <FadeIn delay={0.2}>
              <div className="glass-panel" style={{ borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Inspection Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url: string, i: number) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-colors group cursor-zoom-in">
                      <img src={url} alt={`Inspection Photo ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-6">
          <FadeIn delay={0.3}>
            <div className="glass-panel neon-border-purple" style={{ borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>System Summary</h3>
              
              <div className="space-y-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inspector</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{inspection.inspectorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Units</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{inspection.totalBatteries}</span>
                </div>
                <div className="h-px bg-white/5 my-2" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Healthy</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-green)' }}>{inspection.healthyCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Warnings</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-amber)' }}>{inspection.warningCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Critical</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>{inspection.criticalCount}</span>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="glass-panel neon-border-blue" style={{ borderRadius: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <Gauge size={16} className="text-blue-400" />
                <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>110V Bank Metrics</h3>
              </div>
              
              <div className="space-y-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Voltage</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-blue)' }}>{inspection.totalVoltage_110V?.toFixed(1)}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-blue)' }}>V</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Cell</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{inspection.averageVoltage_110V?.toFixed(2)}V</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Highest</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)' }}>{inspection.maxVoltage_110V?.toFixed(2)}V</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lowest</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>{inspection.minVoltage_110V?.toFixed(2)}V</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Reading Sections */}
      <div className="space-y-8">
        {sections.map(section => {
          const readings = inspection.readings.filter((r: any) => r.section === section.id)
          if (readings.length === 0) return null
          
          return (
            <FadeIn key={section.id}>
              <div className="glass-panel" style={{ borderRadius: '24px', padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                    {section.name}
                  </h3>
                  <div className="badge badge-outline" style={{ fontSize: '10px', fontWeight: 700 }}>
                    {readings.length} CELLS
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3">
                  {readings.map((r: any) => {
                    const isCritical = r.status === 'CRITICAL';
                    const isWarning = r.status === 'WARNING';
                    const neonColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
                    
                    return (
                      <div 
                        key={r.id} 
                        className="stats-card-mini rounded-xl border border-white/5 group hover:border-white/20 transition-all"
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center',
                          borderTop: `2px solid ${neonColor}`,
                          background: `${neonColor}03`
                        }}
                      >
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Cell {r.batteryNumber}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: neonColor }}>
                          {r.voltage?.toFixed(2)}<span style={{ fontSize: '9px', fontWeight: 700, marginLeft: '1px' }}>V</span>
                        </div>
                        {r.specificGravity && (
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
                            {r.specificGravity?.toFixed(3)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </FadeIn>
          )
        })}
      </div>

      <style jsx global>{`
        .glass-panel {
          background: rgba(13, 17, 23, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        }
        .neon-border-blue { border-left: 4px solid #3b82f6; }
        .neon-border-purple { border-left: 4px solid #a855f7; }
        .badge-blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
      `}</style>
    </DashboardLayout>
  )
}
