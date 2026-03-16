'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Champion {
  name: string
  points: number
  designation: string
}

export default function LeaderboardBanner() {
  const [champion, setChampion] = useState<Champion | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    fetch('/api/leaderboard/champion')
      .then(res => res.json())
      .then(data => {
        if (data.champion) setChampion(data.champion)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching champion:', err)
        setLoading(false)
      })

    if ('Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    setIsSubscribed(!!subscription)
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribe = async () => {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })

      // Send to backend
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })

      if (res.ok) {
        setIsSubscribed(true)
        alert('Notifications enabled successfully! 🔔')
      }
    } catch (err) {
      console.error('Failed to subscribe:', err)
    }
  }

  if (loading || !champion) return null

  return (
    <div className="mb-10 antialiased">
      <Link href="/dashboard/leaderboard" className="block focus:outline-none">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="group relative"
        >
          {/* Main Card Container */}
          <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[#0a0f1d] p-6 sm:p-10 shadow-2xl transition-all duration-500 group-hover:border-amber-500/20 group-hover:shadow-amber-500/5">
            
            {/* Elegant Background Accents */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2035] via-transparent to-transparent opacity-40"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] group-hover:bg-amber-500/20 transition-all duration-1000"></div>

            {/* Content Layout */}
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-8">
              
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                {/* Trophy/Icon Workspace */}
                <div className="relative">
                  <motion.div 
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1e293b] border border-white/10 shadow-inner group/icon"
                  >
                    <span className="text-4xl drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">✨</span>
                    {/* Animated Crown/Icon Overlay */}
                    <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-[14px] shadow-lg border-2 border-[#0a0f1d]">
                      🏆
                    </div>
                  </motion.div>
                  {/* Subtle Halo */}
                  <div className="absolute inset-0 -m-4 bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                </div>

                {/* Information Block */}
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <span className="h-[2px] w-8 bg-gradient-to-r from-amber-500 to-transparent"></span>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500/80">
                      Plant Performance Leader
                    </span>
                  </div>
                  
                  <h2 className="mb-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                    {champion.name}
                  </h2>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 transition-colors group-hover:bg-white/10">
                      <span className="text-sm font-bold text-amber-500">{champion.points}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Points</span>
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <span className="text-sm font-medium text-slate-400">
                      Weekly Achievement Honor
                    </span>
                  </div>
                </div>
              </div>

              {/* Action/Badge Area */}
              <div className="flex flex-col items-center md:items-end gap-3 flex-shrink-0">
                <div className="text-right hidden md:block">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-medium text-amber-500 italic">"Outstanding Leadership"</p>
                </div>
                <div className="flex h-12 items-center gap-4 rounded-xl bg-amber-500 px-6 font-black text-[11px] uppercase tracking-[0.2em] text-[#0a0f1d] transition-all hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95">
                  View Full Ranking ➔
                </div>
              </div>

            </div>

            {/* Decorative Grid Line */}
            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          </div>
        </motion.div>
      </Link>

      {/* Modern Subscription Banner */}
      {!isSubscribed && permission !== 'denied' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 transition-all hover:bg-blue-500/10"
        >
          <div className="mb-4 sm:mb-0 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <span className="text-xl">🔔</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Join the Community Alerts</p>
              <p className="text-xs text-slate-400">Stay informed on weekly performance and plant achievements.</p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); subscribe(); }}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-blue-900/40 hover:bg-blue-500 hover:scale-[1.02]"
          >
            Enable Alerts
          </button>
        </motion.div>
      )}
    </div>
  )
}
