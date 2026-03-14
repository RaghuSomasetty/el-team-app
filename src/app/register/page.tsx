'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: 'Engineer', password: '', confirm: '', remember: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          phone: form.phone, 
          designation: form.designation, 
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/login?registered=1')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      padding: '24px',
    }}>
      <div className="tech-bg-overlay" />
      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <img src="/logo.png" alt="Electrical Maintenance App Logo" style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '20px',
              boxShadow: '0 0 30px rgba(59,130,246,0.3)',
              border: '2px solid rgba(255,255,255,0.1)',
            }} />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Join the ELECTRICAL MAINTENANCE APP system
          </p>
        </div>

        <div className="card glass-panel" style={{ padding: '40px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {error && (
            <div style={{ 
              marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: '#ef4444', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' 
            }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="reg-name" type="text" className="form-input" placeholder="e.g. Ravi Kumar" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input id="reg-email" type="email" className="form-input" placeholder="email@plant.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input id="reg-phone" type="tel" className="form-input" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <select id="reg-designation" className="form-select" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} required>
                  <option value="Engineer">Engineer</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Technician">Technician</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input id="reg-password" type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat password" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="reg-remember"
                  checked={form.remember} 
                  onChange={e => setForm({ ...form, remember: e.target.checked })} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="reg-remember" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Remember me for continuous login</label>
              </div>

              <button id="reg-submit-btn" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 25px rgba(59,130,246,0.3)' }} disabled={loading}>
                {loading ? <><span className="spinner" />&nbsp;PROCESSING...</> : '🚀 Register Now'}
              </button>
            </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
