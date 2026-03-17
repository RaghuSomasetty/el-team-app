'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'
import { exportBatteryInspectionToPDF } from '@/lib/exportUtils'

export default function BatteryInspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
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
      <div className="card p-10 text-center">
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
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <Link href="/dashboard/battery-inspection" className="btn btn-outline btn-sm">
          ← Back
        </Link>
        <button onClick={generatePDF} className="btn btn-primary btn-sm flex items-center gap-2">
          📄 Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <FadeIn>
            <div className="card mb-6" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">VoltMind AI Analysis</h3>
                  <p className="text-sm text-slate-400">Automated health assessment</p>
                </div>
                <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">AI Active</div>
              </div>
              <div className="space-y-6">
                {inspection.aiAnalysis?.split(' | ').map((block: string, idx: number) => {
                  const [title, ...rest] = block.split('] ')
                  const sectionTitle = title.replace('[', '')
                  const content = rest.join('] ')
                  const recommendations = inspection.recommendations?.split(' | ')[idx] || ''

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">{sectionTitle}</h4>
                        <div className="text-[10px] text-slate-500 font-mono">REPORT SEC-{idx+1}</div>
                      </div>
                      <p className="text-slate-300 text-sm mb-3 leading-relaxed">{content}</p>
                      {recommendations && (
                        <div className="flex gap-2 items-start bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                          <span className="text-emerald-400">💡</span>
                          <p className="text-xs text-emerald-400 font-medium">{recommendations.split(': ')[1] || recommendations}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-4">Technician Observations</h3>
              <p className="text-slate-300 italic">
                "{inspection.observations || 'No additional observations recorded.'}"
              </p>
            </div>
          </FadeIn>
          
          {imageUrls.length > 0 && (
            <FadeIn delay={0.2}>
              <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4">Inspection Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imageUrls.map((url: string, i: number) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-700">
                      <img src={url} alt={`Inspection Photo ${i+1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}
        </div>

        <div className="lg:col-span-1">
          <FadeIn delay={0.3}>
            <div className="card mb-6 bg-gradient-to-br from-slate-900 to-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">General Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Inspector</span>
                  <span className="font-bold">{inspection.inspectorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Batteries</span>
                  <span className="font-bold">{inspection.totalBatteries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Healthy</span>
                  <span className="text-emerald-500 font-bold">{inspection.healthyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Warnings</span>
                  <span className="text-amber-500 font-bold">{inspection.warningCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Critical</span>
                  <span className="text-red-500 font-bold">{inspection.criticalCount}</span>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="card bg-blue-500/5 border-blue-500/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500 mb-6">110V Bank Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Voltage</span>
                  <span className="font-bold text-blue-400">{inspection.totalVoltage_110V?.toFixed(1)}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Cell</span>
                  <span className="font-bold">{inspection.averageVoltage_110V?.toFixed(2)}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Highest Cell</span>
                  <span className="font-bold text-emerald-500">{inspection.maxVoltage_110V?.toFixed(2)}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lowest Cell</span>
                  <span className="font-bold text-red-500">{inspection.minVoltage_110V?.toFixed(2)}V</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {sections.map(section => {
        const readings = inspection.readings.filter((r: any) => r.section === section.id)
        if (readings.length === 0) return null
        
        return (
          <FadeIn key={section.id}>
            <div className="card mb-8">
              <h3 className="text-base font-bold text-blue-400 mb-4 border-b border-white/5 pb-2 uppercase tracking-widest">
                {section.name}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-10 gap-2">
                {readings.map((r: any) => {
                  const statusColor = r.status === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 
                                    r.status === 'WARNING' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 
                                    'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
                  
                  return (
                    <div key={r.id} className={`p-2 rounded-lg border text-center ${statusColor}`}>
                      <div className="text-[9px] uppercase font-bold opacity-60">C{r.batteryNumber}</div>
                      <div className="text-xs font-bold">{r.voltage?.toFixed(2)}V</div>
                      {r.specificGravity && <div className="text-[10px]">{r.specificGravity?.toFixed(3)}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </FadeIn>
        )
      })}

    </DashboardLayout>
  )
}
