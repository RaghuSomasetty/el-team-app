'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
      remember: form.remember.toString(),
    })

    console.log('Login attempt result:', result)
    
    if (result?.error) {
      console.error('Sign-in error details:', result.error)
    }

    if (result?.ok) {
      router.push('/dashboard')
    } else {
      console.error('Sign-in failed with error:', result?.error)
      setError(result?.error || 'Invalid email or password. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
      position: 'relative',
    }}>
      <div className="tech-bg-overlay" />
      {/* Left panel - HIDDEN ON MOBILE */}
      <div className="login-side-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '40px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(6,182,212,0.03) 100%)',
        borderRight: '1px solid var(--border-color)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ marginBottom: '24px' }}>
            <img src="/logo.png" alt="Electrical Maintenance App Logo" style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '24px',
              boxShadow: '0 0 40px rgba(59,130,246,0.4)',
              border: '2px solid rgba(255,255,255,0.2)',
            }} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px',
            letterSpacing: '-0.5px', color: 'white'
          }}>ELECTRICAL MAINTENANCE</h1>
          <p style={{ fontSize: '14px', color: 'var(--accent-blue)', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '40px', opacity: 0.8 }}>
            Powered by VoltMind AI
          </p>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '⚡', text: 'Real-time maintenance tracking' },
              { icon: '🤖', text: 'AI-powered VoltMind AI chatbot' },
              { icon: '💬', text: 'WhatsApp-style team chat' },
              { icon: '📊', text: 'Automated MIS report generation' },
              { icon: '🔌', text: 'Motor & equipment database' },
            ].map(feat => (
              <div key={feat.icon} style={{ display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(59,130,246,0.05)', borderRadius: '8px', padding: '10px 14px',
                border: '1px solid rgba(59,130,246,0.1)'
              }}>
                <span style={{ fontSize: '20px' }}>{feat.icon}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div className="card glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', color: 'white' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Sign in to continue to VoltMind system</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  checked={form.remember} 
                  onChange={e => setForm({ ...form, remember: e.target.checked })} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Remember me
              </label>
              <Link href="#" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '12px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" />&nbsp;AUTHENTICATING...</> : '⚡ Sign In Now'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              New user?{' '}
              <Link href="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
                Register here
              </Link>
            </p>
          </div>

          <div style={{
            marginTop: '24px', padding: '14px',
            background: 'rgba(59,130,246,0.05)', borderRadius: '10px',
            border: '1px solid rgba(59,130,246,0.1)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Demo Credentials</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Engineer: <strong>admin@elteam.com</strong> / <strong>admin123</strong>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: 'var(--text-muted)' }}>
            DRI Plant Electrical Division © 2026
          </p>
        </div>
      </div>
    </div>
  )
}
