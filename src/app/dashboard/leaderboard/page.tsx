'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
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
          // Assign ranks based on points
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
    <DashboardLayout title="Maintenance Leaderboard" subtitle="Recognizing top performance in plant maintenance">
      {/* Timeframe Selector */}
      <div className="flex bg-slate-800/50 p-1 rounded-lg w-fit mb-8 border border-white/5">
        {(['weekly', 'monthly', 'total'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              timeframe === t 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Top 3 Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
            {/* Rank 2 */}
            <div className="order-2 md:order-1">
              {top3[1] && (
                <FadeIn delay={0.2} direction="up">
                  <div className="relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700 text-center transform hover:scale-105 transition-all">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-slate-400 rounded-full flex items-center justify-center border-4 border-slate-900 font-bold text-slate-900">2</div>
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">👤</div>
                    <h3 className="font-bold text-white mb-1">{top3[1].name}</h3>
                    <p className="text-xs text-slate-400 mb-3 uppercase tracking-widest">{top3[1].designation}</p>
                    <div className="text-2xl font-black text-slate-300">{top3[1].points} pts</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{top3[1].totalActivities} Activities</div>
                  </div>
                </FadeIn>
              )}
            </div>

            {/* Rank 1 */}
            <div className="order-1 md:order-2">
              {top3[0] && (
                <FadeIn delay={0} direction="up">
                  <div className="relative p-8 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-900/10 border-2 border-amber-500/50 text-center transform hover:scale-110 transition-all shadow-xl shadow-amber-500/10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center border-4 border-slate-900 font-bold text-slate-900 shadow-lg text-xl">1</div>
                    <div className="text-4xl mb-4 animate-bounce">👑</div>
                    <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{top3[0].name}</h3>
                    <p className="text-xs text-amber-500 mb-4 uppercase font-black tracking-[0.2em]">{top3[0].designation}</p>
                    <div className="text-4xl font-black text-amber-400 drop-shadow-lg">{top3[0].points} pts</div>
                    <div className="text-[11px] text-amber-500/70 mt-2 uppercase font-bold">{top3[0].totalActivities} Activities Completed</div>
                  </div>
                </FadeIn>
              )}
            </div>

            {/* Rank 3 */}
            <div className="order-3 md:order-3">
              {top3[2] && (
                <FadeIn delay={0.4} direction="up">
                  <div className="relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700 text-center transform hover:scale-105 transition-all">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center border-4 border-slate-900 font-bold text-white">3</div>
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">👤</div>
                    <h3 className="font-bold text-white mb-1">{top3[2].name}</h3>
                    <p className="text-xs text-slate-400 mb-3 uppercase tracking-widest">{top3[2].designation}</p>
                    <div className="text-2xl font-black text-orange-400">{top3[2].points} pts</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{top3[2].totalActivities} Activities</div>
                  </div>
                </FadeIn>
              )}
            </div>
          </div>

          {/* List Section */}
          <div className="card border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Rank</th>
                    <th className="px-6 py-4 text-left">Technician</th>
                    <th className="px-6 py-4 text-left">Activities</th>
                    <th className="px-6 py-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rest.map((entry, i) => (
                    <tr key={entry.userId} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-slate-500 font-mono text-sm">#{entry.rank}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">👤</div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{entry.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{entry.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300 font-medium">{entry.totalActivities}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-white">{entry.points.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                        No ranking data available yet. Start uploading activities to earn points!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
