'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
    <div className="space-y-4 mb-6">
      <Link href="/dashboard/leaderboard" className="block">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/30 p-4 sm:p-6 transition-all hover:border-amber-500/50 group">
          {/* Animated Background Element */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-amber-500 flex items-center justify-center rounded-full shadow-lg shadow-amber-500/30 transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl sm:text-3xl">🏆</span>
            </div>
            
            <div className="flex-grow">
              <div className="text-xs sm:text-sm font-bold text-amber-500 uppercase tracking-wider mb-1">
                Weekly Champion
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-100 transition-colors">
                {champion.name} <span className="text-sm font-normal text-slate-400">— {champion.points} Points</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-1">
                Excellent work in reporting issues and completing preventive maintenance!
              </p>
            </div>
            
            <div className="hidden sm:flex flex-shrink-0 items-center gap-1 text-xs font-bold text-amber-500 uppercase">
              View Ranking <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Notification Prompt */}
      {!isSubscribed && permission !== 'denied' && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <p className="text-xs text-blue-200">Get notified when a new weekly champion is announced!</p>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); subscribe(); }}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-md transition-all shadow-lg shadow-blue-900/40"
          >
            Receive Mobile Alerts
          </button>
        </div>
      )}
    </div>
  )
}
