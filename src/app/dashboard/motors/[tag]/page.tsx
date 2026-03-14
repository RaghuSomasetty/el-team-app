import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MotorDetailsPage({ params }: { params: { tag: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const decodedTag = decodeURIComponent(params.tag)
  const motor = await prisma.motor.findUnique({ where: { motorTag: decodedTag } })

  if (!motor) {
    notFound()
  }

  // Fetch Inspections
  const inspectionsModel = (prisma as any).motorInspection || (prisma as any).MotorInspection
  const inspections = inspectionsModel ? await inspectionsModel.findMany({
    where: { motorTag: decodedTag },
    orderBy: { inspectedAt: 'desc' },
  }) : []

  // Prepare Chart Data
  const chartData = [...inspections].reverse().map((insp: any) => ({
    date: new Date(insp.inspectedAt).toLocaleTimeString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    currentR: insp.currentR || 0,
    currentY: insp.currentY || 0,
    currentB: insp.currentB || 0,
    loadingPct: insp.loadingPct || 0,
  }))

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/dashboard/motors" style={{ color: 'var(--text-muted)', textDecoration: 'none', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          ← Back
        </Link>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            ⚙️ {motor.motorName} 
            <span className={`badge ${motor.status === 'RUNNING' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '14px', padding: '4px 10px' }}>
              {motor.status}
            </span>
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Tag: <strong>{motor.motorTag}</strong> • Area: {motor.area}</p>
        </div>
      </div>

      {/* Static Specs Grid */}
      <h3 style={{ marginBottom: '16px', color: 'var(--accent-cyan)' }}>Technical Specifications</h3>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Power Rating', value: `${motor.powerKw} kW` },
          { label: 'Rated Voltage', value: motor.voltage },
          { label: 'Rated Speed', value: `${motor.rpm.toLocaleString()} RPM` },
          { label: 'Manufacturer', value: motor.manufacturer || '—' },
          { label: 'DE Bearing', value: motor.driveEndBearing || '—', mono: true },
          { label: 'NDE Bearing', value: motor.nonDriveEndBearing || '—', mono: true },
          { label: 'Coupling Type', value: motor.couplingType || '—' },
          { label: 'Install Date', value: motor.installDate ? new Date(motor.installDate).toLocaleDateString() : '—' },
        ].map((spec, i) => (
          <div key={i} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              {spec.label}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: spec.mono ? 'monospace' : 'inherit' }}>
              {spec.value}
            </div>
          </div>
        ))}
      </div>

      {/* Inspections Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--accent-cyan)' }}>Inspection History</h3>
        <Link href={`/dashboard/inspections?tag=${motor.motorTag}`} className="btn btn-primary btn-sm">
          + New Inspection
        </Link>
      </div>

      <div className="grid-2">
        {/* Readings Table */}
        <div className="card" style={{ height: '400px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                <th>Date / Shift</th>
                <th>R-Ph (A)</th>
                <th>Y-Ph (A)</th>
                <th>B-Ph (A)</th>
                <th>Loading %</th>
                <th>Inspector</th>
              </tr>
            </thead>
            <tbody>
              {inspections.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No inspection data found.</td></tr>
              ) : inspections.map((insp: any) => (
                <tr key={insp.id}>
                  <td style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: 600 }}>{new Date(insp.inspectedAt).toLocaleDateString()}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{insp.shift} shift</div>
                  </td>
                  <td>{insp.currentR}</td>
                  <td>{insp.currentY}</td>
                  <td>{insp.currentB}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: 'var(--bg-secondary)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(insp.loadingPct || 0, 100)}%`, height: '100%', background: (insp.loadingPct || 0) > 90 ? '#ef4444' : '#10b981' }} />
                      </div>
                      <span style={{ fontSize: '12px', width: '40px' }}>{insp.loadingPct}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>{insp.inspectedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Abnormality / Remarks */}
        <div className="card" style={{ height: '400px', overflowY: 'auto' }}>
          <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Recent Abnormalities</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inspections.filter((i: any) => i.abnormality && i.abnormality.trim() !== '').length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>✅ No abnormalities reported recently.</div>
            ) : inspections.filter((i: any) => i.abnormality && i.abnormality.trim() !== '').map((insp: any) => (
              <div key={insp.id} style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid #ef4444', padding: '12px', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {new Date(insp.inspectedAt).toLocaleDateString()} • {insp.inspectedBy}
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {insp.abnormality}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
