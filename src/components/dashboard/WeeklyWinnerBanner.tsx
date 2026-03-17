'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Champion {
  name: string
  points: number
  designation: string
  image?: string
}

export default function WeeklyWinnerBanner() {
  const [champion, setChampion] = useState<Champion | null>(null)
  const [loading, setLoading] = useState(true)

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
  }, [])

  if (loading || !champion) return null

  const initials = champion.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="mb-14 antialiased">
      <Link href="/dashboard/leaderboard" className="block focus:outline-none">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="group relative"
        >
          {/* Main Card - Deep Cinematic Theme */}
          <div className="relative overflow-hidden rounded-[32px] bg-[#0c111d] border border-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
            
            {/* Cinematic Light Sweep Background */}
            <motion.div 
              animate={{ 
                x: ['-100%', '200%'],
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-0 z-0 pointer-events-none opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)',
              }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 p-8 sm:p-12">
              
              {/* Profile Side */}
              <div className="relative flex-shrink-0">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative group"
                >
                  {/* Glowing Ring around Profile */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500 via-transparent to-blue-500 opacity-20 group-hover:opacity-40 transition-opacity"
                  />
                  
                  <div 
                    className="relative h-40 w-40 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden shadow-2xl flex items-center justify-center"
                    style={{ minWidth: '160px', minHeight: '160px' }}
                  >
                    {champion.image ? (
                      <div 
                        className="absolute inset-0 w-full h-full"
                        style={{ 
                          backgroundImage: `url(${champion.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-black text-slate-500 uppercase tracking-tighter">{initials}</span>
                    )}
                  </div>

                  {/* Winner Crown Badge */}
                  <motion.div 
                     initial={{ y: 0 }}
                     animate={{ y: [-2, 2, -2] }}
                     transition={{ duration: 3, repeat: Infinity }}
                     className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg border-2 border-[#0c111d] z-20"
                  >
                    <span className="text-2xl">👑</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Text Info Side */}
              <div className="flex-1 text-center md:text-left">
                <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.4 }}
                   className="mb-4 inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full"
                >
                  <span className="text-sm">🏆</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">
                    Weekly Champion Award
                  </span>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-5xl sm:text-6xl font-black text-white leading-tight uppercase tracking-tight mb-2"
                >
                  {champion.name}
                </motion.h2>

                <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.6 }}
                   className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[12px] mb-8"
                >
                  {champion.designation} • Department of Electrical Maintenance
                </motion.p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-12 pt-6 border-t border-white/10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Score</span>
                    <span className="text-4xl font-black text-amber-500 tabular-nums leading-none">
                      {champion.points.toLocaleString()}
                      <span className="text-[12px] ml-1 text-amber-500/60">PTS</span>
                    </span>
                  </div>
                  
                  <div className="h-10 w-px bg-white/10 hidden sm:block" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest leading-none">Status: Elite Performer</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Top 0.01% this week</span>
                  </div>
                </div>
              </div>

              {/* Action Side */}
              <div className="md:self-end pt-8 md:pt-0">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-4 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-xl"
                >
                  View Rankings
                  <span className="text-xl">→</span>
                </motion.div>
              </div>

            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  )
}
