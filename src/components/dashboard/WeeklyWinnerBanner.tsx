'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Champion {
  name: string
  points: number
  designation: string
}

export default function WeeklyWinnerBanner() {
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

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })

      if (res.ok) {
        setIsSubscribed(true)
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
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          className="group relative"
        >
          {/* Main Card - High Contrast Deep Theme */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#0c111d] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] transition-all duration-500 hover:border-blue-500/40">
            
            {/* Glossy Overlay for Depth */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/[0.05] to-transparent"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-7 sm:px-12 sm:py-10 gap-8">
              
              <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
                {/* Prestige Badge - High Visibility */}
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-[#1e293b] to-[#020617] border-2 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-5xl leading-none mb-1 drop-shadow-lg">👑</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 drop-shadow-md">TOP RATED</span>
                    </div>
                  </div>
                  {/* Glowing Rings */}
                  <div className="absolute inset-0 -m-1.5 rounded-full border border-blue-500/30 group-hover:border-blue-500/60 transition-colors duration-700"></div>
                  <div className="absolute inset-0 -m-4 rounded-full border border-blue-500/5 animate-pulse"></div>
                </div>

                {/* Champion Info - Strong Typography */}
                <div className="flex flex-col gap-2">
                  <div className="inline-flex items-center self-center md:self-start gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-blue-200">
                      WEEKLY EXCELLENCE AWARD
                    </span>
                  </div>
                  
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                    {champion.name}
                  </h2>
                  
                  <div className="flex items-center justify-center md:justify-start gap-8 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Designation</span>
                      <span className="text-lg font-bold text-white tracking-wide">{champion.designation}</span>
                    </div>
                    <div className="h-10 w-px bg-white/10"></div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Weekly Activity</span>
                      <span className="text-lg font-black text-blue-400 flex items-center gap-1.5">
                        <span className="text-2xl">{champion.points.toLocaleString()}</span>
                        <span className="text-xs text-blue-300 font-bold uppercase tracking-tighter pt-1">Points</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge & CTA */}
              <div className="flex flex-col items-center md:items-end gap-8 flex-shrink-0">
                <div className="text-right hidden md:block border-l-2 border-emerald-500/30 pl-4">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#4ade80]"></span>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Verified Performance</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400">Leading the field this week</p>
                </div>
                
                <motion.div 
                  whileHover={{ y: -3, backgroundColor: '#f8fafc' }}
                  whileTap={{ scale: 0.97 }}
                  className="group/btn relative px-10 py-4 rounded-2xl bg-white text-[#0f172a] text-[12px] font-black uppercase tracking-[0.25em] shadow-[0_20px_40px_rgba(255,255,255,0.05)] transition-all"
                >
                  Hall of Fame
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 rounded-b-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                </motion.div>
              </div>

            </div>

            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-[-100px]"></div>
          </div>
        </motion.div>
      </Link>

      {/* Subscription Callout - Minimalist */}
      {!isSubscribed && permission !== 'denied' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 flex items-center justify-between border-t border-white/5 pt-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm">🔔</span>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
              Join <span className="text-white">Performance Alerts</span> for weekly updates
            </p>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); subscribe(); }}
            className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
          >
            Enable Access →
          </button>
        </motion.div>
      )}
    </div>
  )
}
