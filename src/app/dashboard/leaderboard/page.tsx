'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import FadeIn from '@/components/animations/FadeIn'

interface LeaderboardEntry {
  userId: string
  name: string
  designation: string
  points: number
  totalActivities: number
  rank: number
}

export default function LeaderboardPage() {
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

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <DashboardLayout 
      title="Maintenance Hall of Fame" 
      subtitle="Celebrating our top-performing technicians and engineers"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Timeframe Selector */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            {(['weekly', 'monthly', 'total'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`relative px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  timeframe === t 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {timeframe === t && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="h-10 w-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculating Standings...</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-end">
              
              {/* Rank 2 - Silver */}
              <div className="order-2 md:order-1">
                {top3[1] && (
                  <FadeIn delay={0.2} direction="up">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-b from-slate-400/20 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <div className="relative p-8 rounded-3xl bg-slate-900/40 border border-slate-400/20 backdrop-blur-xl text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-500 rounded-2xl flex items-center justify-center border-2 border-slate-950 shadow-xl font-black text-slate-950">
                          2
                        </div>
                        <div className="w-20 h-20 bg-slate-800/80 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                          🥈
                        </div>
                        <h3 className="font-black text-xl text-white mb-1">{top3[1].name}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{top3[1].designation}</p>
                        <div className="bg-slate-400/10 rounded-xl py-3 px-4 inline-block border border-slate-400/10">
                          <span className="text-2xl font-black text-slate-200">{top3[1].points.toLocaleString()}</span>
                          <span className="text-[10px] ml-2 font-bold text-slate-500 uppercase">pts</span>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}
              </div>

              {/* Rank 1 - Golden Champion */}
              <div className="order-1 md:order-2">
                {top3[0] && (
                  <FadeIn delay={0} direction="up">
                    <div className="relative group">
                      {/* Champion Glow */}
                      <div className="absolute -inset-1 bg-gradient-to-b from-amber-500/30 to-transparent rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition duration-700" />
                      
                      <div className="relative p-10 rounded-[32px] bg-gradient-to-b from-slate-900/60 to-slate-950 border-2 border-amber-500/30 backdrop-blur-2xl text-center shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-2xl font-black text-slate-950 text-2xl">
                          1
                        </div>
                        
                        <div className="relative mb-6">
                          <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="text-6xl drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                          >
                            👑
                          </motion.div>
                        </div>
                        
                        <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{top3[0].name}</h3>
                        <p className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-6">{top3[0].designation}</p>
                        
                        <div className="bg-amber-500/10 rounded-2xl py-5 px-8 border border-amber-500/20 shadow-inner">
                          <div className="text-5xl font-black text-amber-400 tabular-nums">{top3[0].points.toLocaleString()}</div>
                          <div className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] mt-1">Total Maintenance Points</div>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{top3[0].totalActivities} Activities Verified</span>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}
              </div>

              {/* Rank 3 - Bronze */}
              <div className="order-3 md:order-3">
                {top3[2] && (
                  <FadeIn delay={0.4} direction="up">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-b from-orange-800/20 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <div className="relative p-8 rounded-3xl bg-slate-900/40 border border-orange-800/20 backdrop-blur-xl text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-700 rounded-2xl flex items-center justify-center border-2 border-slate-950 shadow-xl font-black text-white">
                          3
                        </div>
                        <div className="w-20 h-20 bg-slate-800/80 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                          🥉
                        </div>
                        <h3 className="font-black text-xl text-white mb-1">{top3[2].name}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{top3[2].designation}</p>
                        <div className="bg-orange-900/10 rounded-xl py-3 px-4 inline-block border border-orange-900/10">
                          <span className="text-2xl font-black text-orange-400">{top3[2].points.toLocaleString()}</span>
                          <span className="text-[10px] ml-2 font-bold text-orange-800 uppercase">pts</span>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}
              </div>
            </div>

            {/* List Table Section */}
            <div className="relative rounded-[32px] border border-white/5 bg-slate-950/50 backdrop-blur-sm overflow-hidden shadow-2xl">
              <div className="p-8 border-bottom border-white/5 flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Technician Rankings</h4>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{leaderboard.length} Participants Active</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/[0.02] text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    <tr>
                      <th className="px-8 py-4 text-left">Position</th>
                      <th className="px-8 py-4 text-left">Technician</th>
                      <th className="px-8 py-4 text-center">Contributions</th>
                      <th className="px-8 py-4 text-right">Performance Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {rest.map((entry, i) => (
                      <tr key={entry.userId} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-slate-500 font-black text-sm tabular-nums">#{entry.rank}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg border border-white/5 group-hover:border-blue-500/30 transition-colors">
                              👤
                            </div>
                            <div>
                              <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{entry.name}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{entry.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-[10px] font-black text-slate-400 uppercase border border-white/5">
                            {entry.totalActivities} Tasks
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="text-sm font-black text-white tabular-nums">{entry.points.toLocaleString()}</div>
                          <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Points</div>
                        </td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-slate-500">
                          <div className="text-4xl mb-4 opacity-20">📊</div>
                          <p className="text-sm font-bold uppercase tracking-widest">No ranking data available for this period</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .card-blur {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </DashboardLayout>
  )
}
