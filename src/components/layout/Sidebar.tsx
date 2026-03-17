'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { motion } from 'framer-motion'

const navItems = [
  { section: 'Overview', items: [
    { href: '/dashboard', icon: '⚡', label: 'Dashboard' },
    { href: '/dashboard/profile', icon: '👤', label: 'My Profile' },
    { href: '/dashboard/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
    { href: '/dashboard/search', icon: '🔍', label: 'Global Search' },
  ]},
  { section: 'Maintenance', items: [
    { href: '/dashboard/mis', icon: '📋', label: 'Daily MIS', roles: ['ENGINEER', 'SUPERVISOR'] },
    { href: '/dashboard/battery-inspection', icon: '🔋', label: 'Battery Inspection' },
    { href: '/dashboard/upload', icon: '📸', label: 'Upload Activity' },
    { href: '/dashboard/gallery', icon: '🖼️', label: 'Image Gallery' },
    { href: '/dashboard/history', icon: '📜', label: 'History' },
  ]},
  { section: 'Database', items: [
    { href: '/dashboard/motors', icon: '⚙️', label: 'Motor Database' },
    { href: '/dashboard/inspections', icon: '⚡', label: 'Motor Inspection' },
    { href: '/dashboard/equipment', icon: '🔌', label: 'Equipment' },
    { href: '/dashboard/spare-parts', icon: '🔧', label: 'Spare Parts' },
  ]},
  { section: 'Communication', items: [
    { href: '/dashboard/chat', icon: '💬', label: 'Team Chat' },
    { href: '/dashboard/reports', icon: '📄', label: 'MIS Reports' },
  ]},
  { section: 'AI Tools', items: [
    { href: '/dashboard/ai-assistant', icon: '⚡', label: 'VoltMind AI' },
  ]},
]

interface Props {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any
  const role = user?.role || 'TECHNICIAN'
  const profileImage = user?.image

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
          <div className="logo-text">
            <h1 style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.5px' }}>ELECTRICAL</h1>
            <p style={{ fontSize: '10px', color: 'var(--accent-blue)', opacity: 0.8 }}>MAINTENANCE APP</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items
                .filter(item => !(item as any).roles || (item as any).roles.includes(role))
                .map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                      onClick={onClose}
                      id={`nav-${item.href.split('/').pop()}`}
                    >
                      <motion.span 
                        className="nav-icon"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                      >
                        {item.icon}
                      </motion.span>
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Link href="/dashboard/profile" onClick={onClose} style={{ textDecoration: 'none' }}>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '14px', 
                background: profileImage ? `url(${profileImage})` : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '18px', fontWeight: 700, border: '2px solid rgba(255,255,255,0.1)',
                position: 'relative', overflow: 'hidden'
              }}>
                {!profileImage && user?.name?.[0]}
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-blue)', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', border: '2px solid #0a0f1e' }}>
                  ⚙️
                </div>
              </div>
            </Link>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 600 }}>{user?.designation || role}</div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            onClick={() => signOut({ callbackUrl: '/login' })}
            id="logout-btn"
          >
            Log Out 🚪
          </button>
        </div>
      </aside>
    </>
  )
}
