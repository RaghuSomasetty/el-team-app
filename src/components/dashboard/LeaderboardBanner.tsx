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
    <div className="mb-8">
      <Link href="/dashboard/leaderboard" className="block outline-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.005, translateY: -2 }}
          className="relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-amber-500/50 via-yellow-500/20 to-amber-600/50 group cursor-pointer shadow-2xl shadow-amber-500/10"
        >
          {/* Inner Content with Glassmorphism */}
          <div className="relative bg-[#0f172a]/90 backdrop-blur-xl rounded-[15px] p-5 sm:p-8 overflow-hidden">
            
            {/* Animated Flare / Glowing Orbs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] group-hover:bg-amber-500/20 transition-all duration-1000"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-all duration-1000"></div>
            
            {/* Tech Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.743 6.43l-1.414 1.414L42.2 0h1.114zM16.686 0L10.257 6.43l1.414 1.414L17.8 0h-1.114zM37.657 0L44.086 6.43l-1.414 1.414L36.543 0h1.114zM22.343 0L15.914 6.43l1.414 1.414L23.457 0h-1.114zM28.97 0L35.4 6.43l-1.414 1.414L27.857 0h1.114zM32.343 0L25.914 6.43l1.414 1.414L33.457 0h-1.114z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              {/* Trophy Section */}
              <div className="relative flex-shrink-0">
                <motion.div 
                  animate={{ 
                    rotate: [0, -5, 5, -5, 0],
                    scale: [1, 1.05, 1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-300/30"
                >
                  <span className="text-3xl sm:text-4xl drop-shadow-md">🏆</span>
                </motion.div>
                {/* Ring effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/20 scale-125 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
              </div>

              {/* Text Section */}
              <div className="flex-grow text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <span className="h-px w-6 bg-amber-500/50 hidden sm:block"></span>
                  <div className="text-[10px] sm:text-xs font-black text-amber-500 uppercase tracking-[0.2em]">
                    Weekly Performance Champion
                  </div>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-100 to-amber-200">
                    {champion.name}
                  </span>
                </h3>
                
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="text-amber-500 font-bold text-sm">{champion.points}</span>
                    <span className="text-amber-500/60 text-[10px] uppercase font-bold tracking-widest">Points</span>
                  </div>
                  <div className="h-4 w-px bg-white/10"></div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium italic">
                    "{champion.designation} — Leading by example"
                  </p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="flex-shrink-0">
                <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all font-bold text-xs uppercase tracking-widest text-slate-300 group-hover:text-amber-500 flex items-center gap-2">
                  Stats <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Premium Notification Prompt */}
      {!isSubscribed && permission !== 'denied' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600/10 to-transparent border-l-2 border-blue-500 rounded-r-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <span className="text-lg">🔔</span>
              </div>
              <p className="text-xs text-blue-100/80 font-medium">Get real-time alerts when new plant champions are crowned!</p>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); subscribe(); }}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95"
            >
              Enable Mobile Alerts
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
