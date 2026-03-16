'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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
          {/* Main Card - Prestige Theme */}
          <div className="relative overflow-hidden rounded-[20px] bg-[#0c111d] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-amber-500/20">
            
            {/* Professional Metallic Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-amber-500/[0.03] to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:px-10 sm:py-8 gap-8">
              
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                {/* Prestige Badge */}
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/10 shadow-2xl relative z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl leading-none mb-1">👑</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/80">Elite</span>
                    </div>
                  </div>
                  {/* Subtle Achievement Ring */}
                  <div className="absolute inset-0 -m-1 rounded-full border border-amber-500/20 group-hover:border-amber-500/40 transition-colors duration-700"></div>
                  <div className="absolute inset-0 -m-3 rounded-full border border-amber-500/5 animate-pulse"></div>
                </div>

                {/* Champion Info */}
                <div>
                  <div className="inline-flex items-center gap-2 mb-3 bg-white/[0.03] border border-white/5 px-3 py-1 rounded-md">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Weekly Performance Recognition
                    </span>
                  </div>
                  
                  <h2 className="mb-2 text-3xl font-light tracking-tight text-white sm:text-4xl md:text-5xl">
                    <span className="font-black">{champion.name.split(' ')[0]}</span>{' '}
                    <span className="text-slate-400">{champion.name.split(' ').slice(1).join(' ')}</span>
                  </h2>
                  
                  <div className="flex items-center justify-center md:justify-start gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Role</span>
                      <span className="text-sm font-semibold text-white/80">{champion.designation}</span>
                    </div>
                    <div className="h-8 w-px bg-white/5"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Points</span>
                      <span className="text-sm font-black text-amber-500 italic">{champion.points.toLocaleString()} pts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge & CTA */}
              <div className="flex flex-col items-center md:items-end gap-6 flex-shrink-0">
                <div className="text-right hidden md:block">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Excellence Status</span>
                  </div>
                  <p className="text-xs font-medium text-amber-100/50">"Demonstrated Technical Leadership"</p>
                </div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group/btn relative px-8 py-3 rounded-xl bg-white text-[#0c111d] text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-200 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                >
                  View Standings
                  <div className="absolute inset-0 rounded-xl border border-white/50 group-hover/btn:scale-105 opacity-0 group-hover/btn:opacity-100 transition-all duration-300"></div>
                </motion.div>
              </div>

            </div>

            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-[-100px]"></div>
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
