'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

import { exportToPDF, exportToExcel, exportToWord } from '@/lib/exportUtils'

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)

  const generateReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`)
      const data = await res.json()
      setReport(data)
    } finally { setLoading(false) }
  }

  const exportCSV = () => {
    if (!report) return
    const rows = [['Date', 'Area', 'Equipment', 'Tag', 'Work Type', 'Description', 'Engineer', 'Status']]
    report.misEntries.forEach((e: any) => {
      rows.push([new Date(e.date).toLocaleDateString(), e.area, e.equipmentName, e.tagNumber||'', e.workType, e.description, e.engineerName, e.status])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `EL-TEAM_MIS_${year}_${String(month).padStart(2,'0')}.csv`; a.click()
  }

  const handleExport = async (type: 'pdf' | 'excel' | 'word') => {
    if (!report) return
    setExporting(type)
    const monthName = MONTHS[month - 1]
    
    try {
      if (type === 'pdf') {
        exportToPDF(report, monthName, year)
      } else if (type === 'excel') {
        exportToExcel(report, monthName, year)
      } else if (type === 'word') {
        await exportToWord(report, monthName, year)
      }
    } catch (error) {
      console.error(`Export to ${type} failed:`, error)
      alert(`Failed to export to ${type.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <DashboardLayout title="Monthly MIS Report" subtitle="Generate and export maintenance reports">
      {/* Controls */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: '150px' }} value={month} onChange={e => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
        </select>
        <select className="form-select" style={{ width: '100px' }} value={year} onChange={e => setYear(+e.target.value)}>
          {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
        <button className="btn btn-primary" id="generate-report-btn" onClick={generateReport} disabled={loading}>
          {loading ? <><span className="spinner" />&nbsp;Generating...</> : '📊 Generate Report'}
        </button>
        {report && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="btn btn-secondary" onClick={exportCSV} title="Export as CSV files">📊 CSV</button>
            <button className="btn btn-secondary" onClick={() => handleExport('excel')} disabled={!!exporting} title="Export as Excel WorkBook">
              {exporting === 'excel' ? '⏳...' : '📗 Excel'}
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('word')} disabled={!!exporting} title="Export as Word Document">
              {exporting === 'word' ? '⏳...' : '📘 Word'}
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('pdf')} disabled={!!exporting} title="Export as PDF Document">
              {exporting === 'pdf' ? '⏳...' : '📕 PDF'}
            </button>
          </div>
        )}
      </div>

      {report && (
        <>
          {/* Summary */}
          <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(6,182,212,0.03))' }}>
            <h2 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              📄 Monthly MIS Report — {report.month}
            </h2>
            <div className="grid-4">
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-blue)' }}>{report.totalMIS}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total MIS Entries</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-green)' }}>{report.totalActivities}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tech Activities</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-amber)' }}>{Object.keys(report.byWorkType).length}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Work Categories</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-purple)' }}>
                  {report.misEntries.filter((e: any) => e.status === 'APPROVED').length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Approved</div>
              </div>
            </div>
          </div>

          {/* By Work Type */}
          {Object.entries(report.byWorkType).map(([workType, items]: any) => (
            <div key={workType} className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-blue">{workType}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{items.length} entries</span>
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Area</th><th>Equipment</th><th>Tag</th><th>Description</th><th>Engineer</th></tr>
                  </thead>
                  <tbody>
                    {items.map((e: any, i: number) => (
                      <tr key={i}>
                        <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize: '12px' }}>{e.area}</td>
                        <td style={{ fontWeight: 600 }}>{e.equipmentName}</td>
                        <td><span className="tag">{e.tagNumber || '—'}</span></td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>{e.description.substring(0, 80)}</td>
                        <td style={{ fontSize: '12px' }}>{e.engineerName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {report.totalMIS === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No MIS entries for {MONTHS[month-1]} {year}
            </div>
          )}
        </>
      )}

      {!report && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Generate Monthly MIS Report</h3>
          <p style={{ fontSize: '13px' }}>Select month and year, then click <strong>Generate Report</strong></p>
        </div>
      )}
    </DashboardLayout>
  )
}
