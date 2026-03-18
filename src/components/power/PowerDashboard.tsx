'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LucideTrendingUp, LucideActivity, LucideZap, LucideInfo, LucideArrowUpRight, LucideArrowDownRight } from 'lucide-react';
import { formatPowerValue, getConsumptionStatus } from '@/lib/powerUtils';
import FadeIn from '@/components/animations/FadeIn';

export default function PowerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/power-readings/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Syncing Energy Data...</p>
      </div>
    </div>
  );
  
  if (!stats) return <div className="h-96 flex items-center justify-center text-slate-500">No data available yet. Build the plant first!</div>;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <FadeIn delay={0.1}>
          <div className="kpi-card hover-glow">
            <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <LucideZap className="w-6 h-6 text-blue-500" />
            </div>
            <div className="kpi-info">
              <div className="kpi-value text-blue-500">
                {stats.today ? formatPowerValue(stats.today.totalConsumption / 1000) : '0.00'}
              </div>
              <div className="kpi-label">Today's Consumption (MWh)</div>
              {stats.today && (
                <div className={`kpi-change ${stats.today.dailyConsumption <= 0 ? 'up' : 'down'}`}>
                  {stats.today.dailyConsumption <= 0 ? <LucideArrowDownRight className="w-3 h-3" /> : <LucideArrowUpRight className="w-3 h-3" />}
                  {Math.abs(stats.today.dailyConsumption / 1000).toFixed(2)} MWh vs yesterday
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="kpi-card hover-glow">
            <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <LucideTrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div className="kpi-info">
              <div className="kpi-value text-purple-500">
                {formatPowerValue(stats.monthly.total / 1000)}
              </div>
              <div className="kpi-label">Monthly Total (MWh)</div>
              <div className="kpi-change up">
                {stats.monthly.count} readings finalized
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="kpi-card hover-glow">
            <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <LucideActivity className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="kpi-info">
              <div className="kpi-value text-emerald-500">
                {formatPowerValue(stats.monthly.average)}
              </div>
              <div className="kpi-label">Avg Daily Load (kWh)</div>
              <div className="kpi-change up">
                Optimal plant efficiency
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        <FadeIn delay={0.4} direction="left">
          <div className="chart-card hover-glow">
            <div className="chart-title flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LucideTrendingUp className="w-4 h-4 text-blue-500" />
                INDUSTRIAL TREND (kWh)
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">30 Day Log</span>
            </div>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.charts.trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickFormatter={(str) => str.split('-')[2]} // Day only
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                    itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="step" 
                    dataKey="totalConsumption" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.5} direction="right">
          <div className="chart-card hover-glow">
            <div className="chart-title flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LucideActivity className="w-4 h-4 text-emerald-500" />
                INPUT VS OUTPUT BALANCE
              </span>
            </div>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.comparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {stats.charts.comparison.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Industrial Summary Note */}
      <FadeIn delay={0.6}>
        <div className="card glass-panel flex items-start gap-4" style={{ background: 'rgba(59, 130, 246, 0.03)', borderColor: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <LucideInfo className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Operational Insight</h4>
            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
              Daily metrics are synchronized with the DRI main incomer meters. Variance alerts are triggered if net consumption deviates by more than <span className="text-blue-400 font-bold">15.5%</span> from the weekly rolling average.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
