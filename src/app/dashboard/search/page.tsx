'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const search = async () => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <DashboardLayout title="Global Search" subtitle="Search across all plant data">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            type="search"
            className="search-bar"
            style={{ fontSize: '16px', padding: '14px 20px' }}
            placeholder="🔍 Search tag, name, area, description..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            id="global-search-input"
          />
          <button className="btn btn-primary btn-lg" onClick={search} disabled={loading} id="global-search-btn">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="card" style={{ border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', textAlign: 'center', marginBottom: '20px' }}>
            {error}. Please try again.
          </div>
        )}

        {results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Motors */}
            {results.motors?.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px', color: 'var(--accent-cyan)' }}>⚙️ Motors ({results.motors.length})</h3>
                {results.motors.map((m: any) => (
                  <Link href={`/dashboard/inspections?motorTag=${m.motorTag}`} key={m.id} 
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}
                    className="hover-bright">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <span className="tag">{m.motorTag}</span>&nbsp;
                        <strong style={{ marginLeft: '8px' }}>{m.motorName}</strong>
                      </div>
                      <span className="btn btn-secondary btn-sm" style={{ fontSize: '10px' }}>Inspect ➜</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {m.area} · {m.powerKw}kW · {m.voltage} · {m.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Equipment */}
            {results.equipment?.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px', color: 'var(--accent-blue)' }}>🔌 Equipment ({results.equipment.length})</h3>
                {results.equipment.map((e: any) => (
                  <div key={e.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <span className="tag">{e.tagNumber}</span>&nbsp;
                      <strong style={{ marginLeft: '8px' }}>{e.name}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{e.area} · {e.equipmentType}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Spare Parts */}
            {results.parts?.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px', color: 'var(--accent-green)' }}>🔧 Spare Parts ({results.parts.length})</h3>
                {results.parts.map((p: any) => (
                  <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ fontSize: '14px' }}>{p.partName}</strong>&nbsp;
                      <span className="tag" style={{ fontSize: '11px' }}>{p.partNumber}</span>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Equip: {p.equipment || 'General'} · Loc: {p.location || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>Qty: {p.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MIS */}
            {results.mis?.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px', color: 'var(--accent-amber)' }}>📋 MIS Entries ({results.mis.length})</h3>
                {results.mis.map((m: any) => (
                  <Link href="/dashboard/reports" key={m.id} 
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}
                    className="hover-bright">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{m.equipmentName}</strong>
                      <span className="badge badge-blue">{m.workType}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {new Date(m.date).toLocaleDateString()} · {m.area} · {m.engineerName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px' }}>
                      {m.description.substring(0, 150)}...
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* No results */}
            {results.motors.length === 0 && results.equipment.length === 0 && results.parts.length === 0 && results.mis.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕵️‍♂️</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>No results found</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>We couldn't find anything matching <strong>"{q}"</strong>. Try another keyword.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
