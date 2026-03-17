'use client'

import { useEffect, useState, use, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// --- Types ---
interface Task {
  id: string
  type: string
  title: string
  category: string
  date: string
  description: string
  points: number
  images: string[]
  status: string
}

interface UserReport {
  userDetails: {
    id: string
    name: string
    email: string
    department: string
    designation: string
    role: string
    image?: string
  }
  summary: {
    totalPoints: number
    totalTasks: number
    tasksThisMonth: number
    avgPointsPerTask: number
  }
  trend: { date: string, points: number }[]
  tasks: Task[]
}

// --- Icons (Emoji/Simplified for logic) ---
const Icons = {
  Points: "🏆",
  Tasks: "🔧",
  Monthly: "📅",
  Average: "⭐",
  Search: "🔍",
  PDF: "📄",
  WhatsApp: "📱",
  Email: "📧",
  Back: "←"
}

export default function UserReportPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  
  const [report, setReport] = useState<UserReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [sortBy, setSortBy] = useState('LATEST') // LATEST, OLDEST, HIGHEST_POINTS

  useEffect(() => {
    fetchReport()
  }, [userId])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/${userId}/report`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReport(data)
    } catch (err) {
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- Filtering Logic ---
  const filteredTasks = useMemo(() => {
    if (!report) return []
    return report.tasks
      .filter(t => {
        const matchesType = filterType === 'ALL' || t.type === filterType
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesType && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'HIGHEST_POINTS') return b.points - a.points
        if (sortBy === 'OLDEST') return new Date(a.date).getTime() - new Date(b.date).getTime()
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
  }, [report, filterType, searchTerm, sortBy])

  const topSkill = useMemo(() => {
    if (!report || report.tasks.length === 0) return 'N/A'
    const counts: Record<string, number> = {}
    report.tasks.forEach(t => counts[t.category] = (counts[t.category] || 0) + 1)
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }, [report])

  // --- PDF Export ---
  const exportPDF = () => {
    if (!report) return
    console.log('Starting PDF Export...')
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      
      doc.setFontSize(22)
      doc.setTextColor(40, 116, 240)
      doc.text('Performance Report', 14, 22)
      
      doc.setFontSize(12)
      doc.setTextColor(100)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
      
      doc.setTextColor(0)
      doc.setFontSize(16)
      doc.text(report.userDetails.name || 'Technician', 14, 45)
      doc.setFontSize(10)
      doc.text(`${report.userDetails.designation || ''} | ${report.userDetails.department || ''}`, 14, 52)
      
      const summaryData = [
        ['Total Points', (report.summary.totalPoints || 0).toLocaleString()],
        ['Total Tasks', (report.summary.totalTasks || 0).toString()],
        ['Tasks This Month', (report.summary.tasksThisMonth || 0).toString()],
        ['Avg Points/Task', (report.summary.avgPointsPerTask || 0).toString()]
      ]
      
      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [40, 116, 240] },
        styles: { fontSize: 9 }
      })
      
      const taskData = (report.tasks || []).map(t => [
        t.date ? new Date(t.date).toLocaleDateString() : 'N/A',
        t.title || 'Untitled Task',
        t.category || 'General',
        (t.points || 0).toString()
      ])
      
      const lastY = (doc as any).lastAutoTable?.finalY || 100
      doc.setFontSize(14)
      doc.text('Task Log', 14, lastY + 15)
      
      autoTable(doc, {
        startY: lastY + 20,
        head: [['Date', 'Task', 'Category', 'Points']],
        body: taskData,
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139] },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 30 }, 3: { cellWidth: 20 } }
      })
      
      doc.save(`${(report.userDetails.name || 'User').replace(/\s+/g, '_')}_Report.pdf`)
    } catch (err: any) {
      console.error('PDF Export Detailed Error:', err)
      alert(`Failed to generate PDF: ${err.message}`)
    }
  }

  if (loading) return (
    <DashboardLayout title="Report" subtitle="Loading analytics...">
      <div className="flex h-[60vh] items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Compiling Work History...</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (!report) return (
    <DashboardLayout title="Error" subtitle="Data unavailable">
      <div className="p-20 text-center">
        <p className="text-slate-400">Could not find record for this ID.</p>
        <button onClick={() => router.back()} className="mt-8 px-6 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">
          {Icons.Back} Return to Rankings
        </button>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout 
      title={report.userDetails.name} 
      subtitle={`${report.userDetails.designation} • ${report.userDetails.department}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10">
        
        {/* --- Header / Action Bar --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0f172a]/50 p-6 rounded-[32px] border border-white/5 backdrop-blur-sm sticky top-4 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <span className="text-slate-400 group-hover:text-white transition-colors">{Icons.Back}</span>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">{report.userDetails.name}</h2>
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  <span className="text-[10px] font-black text-amber-500 uppercase">Top Performer 🥇</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Employee ID: {report.userDetails.id.slice(-8).toUpperCase()} • {report.userDetails.department} Unit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={exportPDF}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/10 flex items-center gap-2"
            >
              <span>{Icons.PDF}</span> Download PDF Report
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <button title="Share WhatsApp" className="p-3.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-2xl hover:bg-emerald-600/20 transition-all">{Icons.WhatsApp}</button>
              <button title="Share Email" className="p-3.5 bg-slate-800 border border-white/10 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all">{Icons.Email}</button>
            </div>
          </div>
        </div>

        {/* --- KPI Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            icon={Icons.Points} 
            label="Total Points" 
            value={report.summary.totalPoints.toLocaleString()} 
            color="blue" 
            sub="Overall Lifetime"
          />
          <KPICard 
            icon={Icons.Tasks} 
            label="Tasks Completed" 
            value={report.summary.totalTasks.toString()} 
            color="emerald" 
            sub="Verified Activities"
          />
          <KPICard 
            icon={Icons.Monthly} 
            label="This Month" 
            value={report.summary.tasksThisMonth.toString()} 
            color="purple" 
            sub="Current Cycle"
          />
          <KPICard 
            icon={Icons.Average} 
            label="Avg Pts/Task" 
            value={report.summary.avgPointsPerTask.toString()} 
            color="amber" 
            sub="Efficiency Score"
          />
        </div>

        {/* --- Charts & Analytics Meta --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-[#0c111d] rounded-[40px] border border-white/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] -mr-40 -mt-40 pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-1000"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Performance Analytics</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-widest italic">Daily Point accumulation trend</p>
              </div>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                {['7D', '30D', '90D'].map(t => (
                  <button key={t} className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${t === '7D' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.trend}>
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{fontSize: 9, fill: '#475569', fontWeight: 'bold'}} 
                    axisLine={false} 
                    tickLine={false} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0f172a', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '20px', 
                      fontSize: '11px',
                      padding: '12px 16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '6px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#curveGrad)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deep Analytics Side Card */}
          <div className="bg-[#0c111d] rounded-[40px] border border-white/5 p-8 flex flex-col justify-between">
            <div className="space-y-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Expertise Map</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Dominant Skill Type</p>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xl font-black text-white uppercase tracking-tight">{topSkill}</p>
                    <p className="text-[10px] font-bold text-blue-500/70 mt-1 uppercase">Most frequent activity</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Efficiency Progress</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-widest">
                      <span>Monthly Goal</span>
                      <span>{Math.round((report.summary.tasksThisMonth / 100) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (report.summary.tasksThisMonth / 100) * 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 text-center mt-auto">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Industrial ID Scan</p>
              <div className="flex justify-center opacity-30 invert">
                <div className="h-10 w-48 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e9/UPC-A-barcode.svg')] bg-repeat-x bg-contain"></div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Work Log with Filters --- */}
        <div className="space-y-8 pt-8 border-t border-white/5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-1.5 bg-blue-600 rounded-full hidden sm:block"></div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Industrial Work Log</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Complete verified execution history</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] p-2 rounded-[24px] border border-white/5">
              {/* Search */}
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  {Icons.Search}
                </span>
                <input 
                  type="text"
                  placeholder="SEARCH LOGS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-48 transition-all"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-1">
                {['ALL', 'MAINTENANCE', 'MIS', 'INSPECTION'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all ${filterType === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Sort Toggle */}
              <div className="h-6 w-[1px] bg-white/10 mx-2 hidden lg:block"></div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] focus:outline-none cursor-pointer hover:text-white py-2"
              >
                <option value="LATEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="HIGHEST_POINTS">High Points</option>
              </select>
            </div>
          </div>

          {/* Cards Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, idx) => (
                <ActivityCard key={task.id} task={task} index={idx} />
              ))}
            </AnimatePresence>
          </div>

          {filteredTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[40px]"
            >
              <div className="max-w-xs mx-auto space-y-4 opacity-30">
                <p className="text-6xl -scale-x-100">🚫</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">No records match your criteria</p>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}

// --- Sub-components ---

function KPICard({ icon, label, value, color, sub }: { icon: string, label: string, value: string, color: string, sub: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-500"
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-8 rounded-[40px] bg-[#0c111d] border border-white/5 relative overflow-hidden group shadow-2xl transition-all hover:translate-y-[-4px] hover:border-white/10`}
    >
      <div className={`absolute top-0 right-0 p-6 opacity-10 text-4xl group-hover:scale-125 transition-transform duration-700`}>{icon}</div>
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
        </div>
        
        <div>
          <p className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{value}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors[color]} bg-opacity-10 uppercase tracking-widest`}>{sub}</span>
          </div>
        </div>
      </div>
      
      {/* Decorative scanner line */}
      <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity translate-y-[2px]"></div>
    </motion.div>
  )
}

function ActivityCard({ task, index }: { task: Task, index: number }) {
  const isInspection = task.type === 'INSPECTION'
  const isMIS = task.type === 'MIS'
  const isBreakdown = task.category.toLowerCase().includes('breakdown')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="group bg-[#0c111d] rounded-[32px] border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all shadow-xl hover:shadow-blue-500/5"
    >
      {/* Visual Header (Colored Bar) */}
      <div className={`h-1.5 w-full ${
        isBreakdown ? 'bg-orange-600' :
        isInspection ? 'bg-emerald-600' :
        isMIS ? 'bg-purple-600' : 'bg-blue-600'
      }`}></div>

      <div className="p-7 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 max-w-[70%]">
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight border ${
                isBreakdown ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                isInspection ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                {task.category}
              </span>
            </div>
            <h4 className="text-base font-black text-white leading-tight uppercase tracking-tight group-hover:text-blue-400 transition-colors">
              {task.title}
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white tabular-nums tracking-tighter">
              {new Date(task.date).toLocaleDateString()}
            </p>
            <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">Verified Log</p>
          </div>
        </div>

        {/* Thumbnail Stack if images exist */}
        {task.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 h-24">
            {task.images.slice(0, 2).map((img, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden border border-white/5 transform transition-transform group-hover:scale-[1.02]">
                <img src={img} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded-lg text-[7px] font-black text-white italic uppercase">
                  {i === 0 ? 'Before' : 'After'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="min-h-[48px]">
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed line-clamp-3">
            {task.description || "Activity successfully executed and verified by field engineers."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              <div className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[8px] font-black text-blue-400">#</div>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">System Generated</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xl font-black text-white leading-none">+{task.points}</span>
              <span className="text-[8px] font-black text-slate-600 block leading-none mt-1">DPD UNIT PTS</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <span className="text-sm font-black">✅</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
