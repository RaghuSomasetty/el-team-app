'use client'
import { useEffect, useState, startTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FadeIn from '@/components/animations/FadeIn'
import LeaderboardBanner from '@/components/dashboard/LeaderboardBanner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const MOCK_TREND = Array.from({ length: 14 }, (_, i) => ({
  day: `Mar ${i + 1}`,
  pmi: Math.floor(Math.random() * 8 + 2),
  rpmi: Math.floor(Math.random() * 4 + 1),
  cable: Math.floor(Math.random() * 3),
  lighting: Math.floor(Math.random() * 3),
}))

const AREA_DATA = [
  { area: 'M-1 Furnace', count: 24, fill: '#3b82f6' },
  { area: 'M-2 Furnace', count: 18, fill: '#06b6d4' },
  { area: 'Reformer', count: 15, fill: '#8b5cf6' },
  { area: 'DRI Handling', count: 12, fill: '#10b981' },
  { area: 'Utilities', count: 9, fill: '#f59e0b' },
]

const WORK_TYPE_DATA = [
  { name: 'PMI', value: 40, fill: '#3b82f6' },
  { name: 'RPMI', value: 25, fill: '#06b6d4' },
  { name: 'Cable', value: 15, fill: '#10b981' },
  { name: 'Lighting', value: 12, fill: '#f59e0b' },
  { name: 'Breaker', value: 8, fill: '#8b5cf6' },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({ todayMIS: 0, motors: 0, activities: 0, pending: 0 })
  const [recentMIS, setRecentMIS] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    
    // Prompt for push notifications
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission().then(p => {
          if (p === 'granted') window.location.reload()
        })
      }, 3000)
    }
  }, [status, router])

  useEffect(() => {
    if (!session) return
    // Load cached stats instantly, then revalidate in background
    const cached = sessionStorage.getItem('el-dashboard-stats')
    if (cached) {
      try {
        const { stats: s, mis } = JSON.parse(cached)
        setStats(s)
        setRecentMIS(mis)
      } catch {}
    }
    startTransition(() => { fetchData() })
  }, [session])

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [misRes, motorRes, actRes, pendingRes, leaderRes] = await Promise.all([
        fetch(`/api/mis?date=${today}`),
        fetch('/api/motors'),
        fetch('/api/activities'),
        fetch('/api/mis?status=DRAFT'),
        fetch('/api/leaderboard?timeframe=weekly'),
      ])
      const [mis, motors, activities, pending, leaders] = await Promise.all([
        misRes.json(), motorRes.json(), actRes.json(), pendingRes.json(), leaderRes.json()
      ])
      const newStats = {
        todayMIS: Array.isArray(mis) ? mis.length : 0,
        motors: Array.isArray(motors) ? motors.length : 0,
        activities: Array.isArray(activities) ? activities.length : 0,
        pending: Array.isArray(pending) ? pending.length : 0,
      }
      const newMIS = Array.isArray(mis) ? mis.slice(0, 5) : []
      const newLeaders = Array.isArray(leaders) ? leaders.slice(0, 5) : []
      setStats(newStats)
      setRecentMIS(newMIS)
      setLeaderboard(newLeaders)
      // Cache for instant re-visit within same session
      sessionStorage.setItem('el-dashboard-stats', JSON.stringify({ 
        stats: newStats, 
        mis: newMIS,
        leaders: newLeaders
      }))
    } catch (e) {
      console.error(e)
    }
  }

  if (status === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><span className="spinner" /></div>
  }

  const kpis = [
    { label: "Today's MIS Entries", value: stats.todayMIS, icon: '📋', color: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6', change: '+3 from yesterday', up: true },
    { label: 'Motors in Database', value: stats.motors, icon: '⚙️', color: 'rgba(57,184,255,0.1)', iconColor: '#38bdf8', change: 'Total registered', up: true },
    { label: 'Activities Uploaded', value: stats.activities, icon: '📸', color: 'rgba(16,185,129,0.1)', iconColor: '#10b981', change: 'All time', up: true },
    { label: 'Pending Approvals', value: stats.pending, icon: '⏳', color: 'rgba(239, 68, 68, 0.1)', iconColor: '#ef4444', change: 'Awaiting review', up: false },
  ]

  return (
    <DashboardLayout title="Dashboard" subtitle="Electrical Maintenance Overview">
      <LeaderboardBanner />
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span className="dot-live" />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Live — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <FadeIn key={k.label} delay={i * 0.1}>
            <div className="kpi-card hover-glow">
              <div className="kpi-icon" style={{ background: k.color }}>
                <span style={{ fontSize: '22px' }}>{k.icon}</span>
              </div>
              <div className="kpi-info">
                <div className="kpi-value" style={{ color: k.iconColor }}>{k.value}</div>
                <div className="kpi-label">{k.label}</div>
                <div className={`kpi-change ${k.up ? 'up' : 'down'}`}>
                  {k.up ? '▲' : '▼'} {k.change}
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: '20px' }}>
        <FadeIn delay={0.4} direction="left">
          <div className="chart-card glass-panel hover-glow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px' }}>
            <div className="chart-title">📈 14-Day Maintenance Trend</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={MOCK_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPmi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)' }} />
                <Area type="monotone" dataKey="pmi" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPmi)" name="Maintenance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>

        <FadeIn delay={0.5} direction="right">
          <div className="chart-card hover-glow">
            <div className="chart-title">🍩 Work Type Distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={WORK_TYPE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {WORK_TYPE_DATA.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>
      </div>

      {/* Charts Row 2 & Leaderboard */}
      <div className="grid-sidebar-layout" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="chart-card">
            <div className="chart-title">🏭 Area-wise Maintenance Load</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={AREA_DATA} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={70} />
                <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {AREA_DATA.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="chart-title">📋 Recent MIS Entries</div>
            {recentMIS.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                No MIS entries today. <br />
                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => router.push('/dashboard/mis')}>
                  Create Entry
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Type</th>
                      <th>Area</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMIS.map(m => (
                      <tr key={m.id}>
                        <td>{m.equipmentName}</td>
                        <td><span className="badge badge-blue">{m.workType}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{m.area}</td>
                        <td><span className={`badge ${m.status === 'APPROVED' ? 'badge-green' : 'badge-amber'}`}>{m.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card glass-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px' }}>
          <div className="chart-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span className="flex items-center gap-2">
              <span className="text-xl">🏆</span> 
              <span className="font-black uppercase tracking-widest text-[11px] text-white/90">Top Performers</span>
            </span>
            <span 
              className="text-[10px] font-black uppercase tracking-widest text-blue-400 cursor-pointer hover:text-blue-300 transition-colors" 
              onClick={() => router.push('/dashboard/leaderboard')}
            >
              View Ranking →
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <p className="text-xs font-bold uppercase tracking-widest">No rankings available yet</p>
              </div>
            ) : (
              leaderboard.map((user, idx) => (
                <div key={user.userId} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px', 
                  borderRadius: '16px', 
                  background: idx === 0 ? 'rgba(234, 179, 8, 0.05)' : 'rgba(255,255,255,0.01)',
                  border: idx === 0 ? '1px solid rgba(234, 179, 8, 0.2)' : '1px solid rgba(255,255,255,0.03)',
                  transition: 'all 0.2s ease'
                }} className="group hover:bg-white/[0.04]">
                  <div style={{ 
                    width: '32px', height: '32px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: idx < 3 ? '18px' : '12px',
                    fontWeight: 900,
                    color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'rgba(255,255,255,0.2)'
                  }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>{user.name}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.designation}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: idx === 0 ? '#fbbf24' : 'var(--accent-blue)' }}>{user.points.toLocaleString()}</div>
                    <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.2)' }}>Points</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
              Upload tasks and verify inspections to climb the leaderboard!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <FadeIn delay={0.8}>
        <div className="card hover-glow">
          <div className="chart-title">⚡ Quick Actions</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: '📋 New MIS Entry', href: '/dashboard/mis', color: 'btn-primary' },
              { label: '📸 Upload Activity', href: '/dashboard/upload', color: 'btn-success' },
              { label: '🤖 Ask VoltMind AI', href: '/dashboard/ai-assistant', color: 'btn-secondary' },
              { label: '💬 Team Chat', href: '/dashboard/chat', color: 'btn-secondary' },
              { label: '📄 Generate Report', href: '/dashboard/reports', color: 'btn-secondary' },
            ].map((a, i) => (
              <button 
                key={a.label} 
                className={`btn ${a.color}`} 
                onClick={() => router.push(a.href)}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {a.label}
              </button>
            ))}
            
            {/* Test Push Notification Button - Only for Development/Testing */}
            <button 
              className="btn btn-secondary border border-red-500/50 hover:bg-red-500/10"
              onClick={async () => {
                if (!confirm('This will broadcast a motivational quote to ALL registered devices. Proceed?')) return;
                try {
                  const res = await fetch(`/api/notifications/daily-quote?secret=el_team_reset_secret_2026`, {
                    method: 'POST'
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert(`✅ Sent! Quote: "${data.quote}"\nReceived by ${data.notificationsSent}/${data.totalSubscriptions} devices.`);
                  } else {
                    alert(`❌ Failed: ${data.error}`);
                  }
                } catch (err) {
                  alert('❌ Error triggering notification');
                  console.error(err);
                }
              }}
            >
              🔔 Send Test Push
            </button>
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  )
}
