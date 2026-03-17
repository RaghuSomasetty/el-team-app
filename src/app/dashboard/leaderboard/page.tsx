'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'

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

// Standings table follows

import { useRouter } from 'next/navigation'

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

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <DashboardLayout 
      title="Maintenance Leaderboard" 
      subtitle="Performance rankings based on verified activities"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Simple Timeframe Toggle */}
        <div className="flex items-center gap-8 mb-16 border-b border-white/5 pb-4">
          {(['weekly', 'monthly', 'total'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-colors relative pb-4 ${
                timeframe === t ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
              {timeframe === t && (
                <motion.div 
                  layoutId="activeUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading standings...</p>
          </div>
        ) : (
          <div className="space-y-24">
            
            {/* Top 3 - Plain Text & Clear Pics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 border-b border-white/5 pb-20">
              {top3.map((entry, idx) => (
                <div key={entry.userId} className={`flex items-start gap-8 ${idx === 0 ? 'md:scale-105 origin-left' : ''}`}>
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-orange-700'} uppercase tracking-tighter`}>
                        RANK 0{entry.rank}
                      </span>
                      {idx === 0 && <span className="text-xl">🏆</span>}
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight uppercase tracking-tight mb-1">{entry.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{entry.designation}</p>
                    <div className="flex items-center justify-between items-end gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white tabular-nums">{entry.points.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Points</span>
                      </div>
                      <button 
                        onClick={() => router.push(`/dashboard/leaderboard/report/${entry.userId}`)}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-md"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rest of the Rankings - Clean Table */}
            <div className="space-y-8 pb-32">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Technician Standings</h4>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{leaderboard.length} Total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-slate-600 text-[9px] uppercase font-black tracking-widest border-b border-white/5">
                    <tr>
                      <th className="py-4 font-black w-20">#</th>
                      <th className="py-4 font-black">Professional</th>
                      <th className="py-4 text-center font-black">Tasks</th>
                      <th className="py-4 text-right font-black">Score</th>
                      <th className="py-4 text-right font-black w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {(rest.length > 0 ? rest : leaderboard).map((entry) => {
                      const isMe = session?.user?.name === entry.name
                      return (
                        <tr key={entry.userId} className={`group ${isMe ? 'bg-blue-500/[0.02]' : ''}`}>
                          <td className="py-8">
                            <span className="text-xs font-black text-slate-600 tabular-nums">
                              {entry.rank < 10 ? `0${entry.rank}` : entry.rank}
                            </span>
                          </td>
                          <td className="py-8">
                            <div className="flex items-center gap-8">
                              <div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-bold uppercase tracking-tight ${isMe ? 'text-blue-400' : 'text-white'}`}>
                                    {entry.name}
                                  </span>
                                  {isMe && <span className="text-[8px] border border-blue-500/30 text-blue-500 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">Me</span>}
                                </div>
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">{entry.designation}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-8 text-center">
                            <span className="text-xs font-bold text-slate-400 tabular-nums">{entry.totalActivities}</span>
                          </td>
                          <td className="py-8 text-right">
                            <div className="text-base font-black text-white tabular-nums tracking-tighter">{entry.points.toLocaleString()}</div>
                          </td>
                          <td className="py-8 text-right">
                            <button 
                              onClick={() => router.push(`/dashboard/leaderboard/report/${entry.userId}`)}
                              className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                            >
                              View Report
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
