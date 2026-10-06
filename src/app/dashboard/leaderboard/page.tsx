'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Award, TrendingUp, Users, Calendar, ArrowRight, ChevronRight, Star } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  name: string
  designation: string
  image?: string
  points: number
  totalActivities: number
  rank: number
  email?: string
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'total'>('weekly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const ranked = data.map((entry, index) => ({
            ...entry,
            rank: index + 1
          }))
          setLeaderboard(ranked)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching leaderboard:', err)
        setLoading(false)
      })
  }, [timeframe])

  // Re-order top 3 for podium: [2, 1, 3]
  const top3 = leaderboard.slice(0, 3)
  const podium = top3.length >= 3 
    ? [top3[1], top3[0], top3[2]] 
    : top3.length === 2 
      ? [top3[1], top3[0]] 
      : top3
  
  const rest = leaderboard.slice(3)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <DashboardLayout 
      title="Performance Leaderboard" 
      subtitle="Recognizing excellence in electrical maintenance & safety"
    >
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {/* Modern Timeframe Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2 p-1 bg-slate-900/50 border border-white/5 rounded-2xl w-fit">
            {(['weekly', 'monthly', 'total'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all relative ${
                  timeframe === t 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {timeframe === t && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-blue-500" />
              <span>{leaderboard.length} Participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" />
              <span>Cycle: {timeframe}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Calculating Rankings...</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-16"
          >
            
            {/* The Podium Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative py-4">
              {/* Background glow for the #1 spot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[80%] bg-blue-600/10 blur-[120px] pointer-events-none hidden md:block" />
              
              {podium.map((entry, idx) => {
                const isWinner = entry.rank === 1
                const isSecond = entry.rank === 2
                const isThird = entry.rank === 3
                
                // Color mapping: 1st=Gold/Amber, 2nd=Silver/Slate, 3rd=Bronze/Orange
                const accentColor = isWinner ? '#fbbf24' : isSecond ? '#94a3b8' : '#b45309'
                const glowColor = isWinner ? 'rgba(251, 191, 36, 0.2)' : isSecond ? 'rgba(148, 163, 184, 0.15)' : 'rgba(180, 83, 9, 0.15)'
                
                return (
                  <motion.div 
                    key={entry.userId}
                    variants={itemVariants}
                    className={`relative flex flex-col items-center ${isWinner ? 'order-1 md:order-2 md:-translate-y-8 z-20' : isSecond ? 'order-2 md:order-1' : 'order-3'}`}
                  >
                    {/* Rank Badge Floating Above */}
                    <div className="mb-4 flex flex-col items-center gap-1 group">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-2xl transition-transform group-hover:scale-110 ${isWinner ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                        {isWinner ? <Trophy size={24} /> : isSecond ? <Medal size={22} /> : <Award size={22} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rank 0{entry.rank}</span>
                    </div>

                    {/* Card Content */}
                    <div 
                      className="w-full glass-panel p-8 rounded-[32px] text-center transition-all hover:border-white/20 relative group overflow-hidden"
                      style={{ 
                        boxShadow: `0 20px 40px -10px rgba(0,0,0,0.5), inset 0 0 20px ${glowColor}`,
                        border: isWinner ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {/* Inner Shine Effect */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative mb-6 mx-auto w-20 h-20">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="w-full h-full rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-2xl font-black text-white overflow-hidden uppercase">
                          {entry.name.charAt(0)}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-white tracking-tight mb-1 line-clamp-1">{entry.name}</h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">{entry.designation}</p>
                      
                      <div className="space-y-4">
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                          <div className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: accentColor }}>
                            {entry.points.toLocaleString()}
                          </div>
                          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">Performance Score</div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 border-t border-white/5 pt-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-white font-black text-xs">{entry.totalActivities}</span>
                            <span className="uppercase tracking-tighter opacity-60">Tasks</span>
                          </div>
                          <button 
                            onClick={() => router.push(`/dashboard/leaderboard/report/${entry.userId}`)}
                            className="flex items-center gap-1.5 text-blue-400 hover:text-white transition-colors uppercase tracking-widest text-[9px] font-black group/btn"
                          >
                            Report <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Standings Table Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-indigo-400" />
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Technician Standings</h4>
                </div>
                <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/5 to-transparent hidden md:block" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{rest.length > 0 ? rest.length : leaderboard.length} Rankers</span>
              </div>

              <div className="bg-slate-900/30 backdrop-blur-md rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-6 px-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Pos</th>
                      <th className="py-6 px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Professional</th>
                      <th className="py-6 px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Achievements</th>
                      <th className="py-6 px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Performance Score</th>
                      <th className="py-6 px-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Full Stats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {(rest.length > 0 ? rest : leaderboard).map((entry) => {
                      const isMe = session?.user?.name === entry.name
                      return (
                        <tr 
                          key={entry.userId} 
                          className={`group transition-all hover:bg-white/[0.03] ${isMe ? 'bg-blue-500/[0.03]' : ''}`}
                        >
                          <td className="py-7 px-8">
                            <div className="flex items-center gap-4">
                              <span className={`text-sm font-black tabular-nums transition-colors group-hover:text-white ${isMe ? 'text-blue-400' : 'text-slate-600'}`}>
                                {entry.rank < 10 ? `0${entry.rank}` : entry.rank}
                              </span>
                              {isMe && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                            </div>
                          </td>
                          <td className="py-7 px-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-all">
                                {entry.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-black tracking-tight ${isMe ? 'text-blue-400' : 'text-white'}`}>
                                    {entry.name}
                                  </span>
                                  {isMe && <span className="text-[7px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase border border-blue-500/20">Me</span>}
                                </div>
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{entry.designation}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-7 px-4 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-white/5 text-[10px] font-black text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                              <Star size={10} />
                              <span>{entry.totalActivities} Tasks</span>
                            </div>
                          </td>
                          <td className="py-7 px-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-lg font-black tabular-nums tracking-tighter ${isMe ? 'text-blue-400' : 'text-white'}`}>
                                {entry.points.toLocaleString()}
                              </span>
                              <div className="flex items-center gap-1 text-[8px] font-black text-slate-700 uppercase tracking-tighter group-hover:text-slate-500 transition-colors">
                                <TrendingUp size={8} /> Points
                              </div>
                            </div>
                          </td>
                          <td className="py-7 px-8 text-right">
                            <button 
                              onClick={() => router.push(`/dashboard/leaderboard/report/${entry.userId}`)}
                              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all group/btn shadow-xl"
                            >
                              <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Motivational Footer */}
            <div className="pt-12 text-center">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] leading-relaxed max-w-lg mx-auto">
                Consistency is the key to excellence.<br />Verified inspections and maintenance activities contribute to your total standing.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
