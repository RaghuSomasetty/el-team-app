'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import VoltMindWidget from '../ai/VoltMindWidget'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function DashboardLayout({ title, subtitle, children, actions }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const pathname = usePathname()

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'U'
  const isAiAssistant = pathname === '/dashboard/ai-assistant'
  const isChat = pathname === '/dashboard/chat'

  return (
    <div className={`app-layout ${isAiAssistant ? 'ai-assistant-page' : ''}`}>
      <div className="tech-bg-overlay" />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className={`main-content ${isAiAssistant ? 'full-screen-main' : ''}`}>
        {!isAiAssistant && (
          <header className="topbar">
          <motion.div 
            className="topbar-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              className="btn btn-secondary btn-sm hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              id="hamburger-btn"
            >
              ☰
            </button>
            <img src="/logo.png" alt="VoltMind Logo" className="mobile-logo" />
            <div>
              <div className="topbar-title">{title}</div>
              {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
            </div>
          </motion.div>
          <motion.div 
            className="topbar-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {actions}
            <input
              type="search"
              className="topbar-search"
              placeholder="Quick search..."
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/dashboard/search?q=${(e.target as HTMLInputElement).value}`)}
              id="topbar-search"
            />
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            <button 
              className="avatar-btn" 
              title={user?.name} 
              id="avatar-btn"
              style={{
                backgroundImage: user?.image ? `url(${user.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: user?.image ? '2px solid var(--accent-blue)' : 'none'
              }}
            >
              {!user?.image && initials}
            </button>
          </motion.div>
        </header>
        )}
        <motion.div 
          className="page-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </main>
      {(!isAiAssistant && !isChat) && <VoltMindWidget />}
    </div>
  )
}
