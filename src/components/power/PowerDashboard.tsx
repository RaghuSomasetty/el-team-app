'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LucideTrendingUp, LucideActivity, LucideZap, LucideGauge, LucideArrowUpRight, LucideArrowDownRight, LucideEye } from 'lucide-react';
import { formatPowerValue } from '@/lib/powerUtils';
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
    <div className="pd-loading">
      <div className="pd-spinner" />
      <p>Loading power data...</p>
    </div>
  );
  
  if (!stats) return (
    <div className="pd-loading">
      <p style={{ color: 'rgba(148,163,184,0.5)' }}>No data available. Check your connection.</p>
    </div>
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="pd-wrapper">
      {/* KPI Cards */}
      <div className="pd-kpi-grid">
        <FadeIn delay={0.1}>
          <div className="pd-kpi-card">
            <div className="pd-kpi-top">
              <div className="pd-kpi-icon pd-kpi-icon-blue">
                <LucideZap size={20} />
              </div>
              {stats.today && (
                <span className={`pd-kpi-badge ${stats.today.dailyConsumption <= 0 ? 'pd-badge-green' : 'pd-badge-red'}`}>
                  {stats.today.dailyConsumption <= 0 ? <LucideArrowDownRight size={12} /> : <LucideArrowUpRight size={12} />}
                  {Math.abs(stats.today.dailyConsumption / 1000).toFixed(1)} MWh
                </span>
              )}
            </div>
            <div className="pd-kpi-value">
              {stats.today ? formatPowerValue(stats.today.totalConsumption / 1000) : '0.0'}
              <span className="pd-kpi-unit pd-unit-blue">MWh</span>
            </div>
            <div className="pd-kpi-label">
              <span className="pd-dot pd-dot-blue" />
              Daily Consumption
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="pd-kpi-card">
            <div className="pd-kpi-top">
              <div className="pd-kpi-icon pd-kpi-icon-purple">
                <LucideTrendingUp size={20} />
              </div>
              <span className="pd-kpi-badge pd-badge-purple">
                {stats.monthly.count} entries
              </span>
            </div>
            <div className="pd-kpi-value">
              {formatPowerValue(stats.monthly.total / 1000)}
              <span className="pd-kpi-unit pd-unit-purple">MWh</span>
            </div>
            <div className="pd-kpi-label">
              <span className="pd-dot pd-dot-purple" />
              Monthly Total
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="pd-kpi-card">
            <div className="pd-kpi-top">
              <div className="pd-kpi-icon pd-kpi-icon-amber">
                <LucideGauge size={20} />
              </div>
              <span className={`pd-kpi-badge ${stats.peakLoad > stats.monthly.average * 1.5 ? 'pd-badge-red' : 'pd-badge-amber'}`}>
                {stats.peakLoad > stats.monthly.average * 1.5 ? 'Critical' : 'Normal'}
              </span>
            </div>
            <div className="pd-kpi-value">
              {formatPowerValue(stats.peakLoad)}
              <span className="pd-kpi-unit pd-unit-amber">kVA</span>
            </div>
            <div className="pd-kpi-label">
              <span className="pd-dot pd-dot-amber" />
              Peak Load
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Charts */}
      <div className="pd-charts-grid">
        <FadeIn delay={0.25}>
          <div className="pd-chart-card">
            <div className="pd-chart-header">
              <div className="pd-chart-header-left">
                <div className="pd-chart-icon pd-chart-icon-blue">
                  <LucideActivity size={18} />
                </div>
                <div>
                  <h3 className="pd-chart-title">Consumption Trend</h3>
                  <p className="pd-chart-desc">Daily power usage over time</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard/power-consumption/reports'}
                className="pd-chart-action"
              >
                <LucideEye size={14} />
                <span>View Reports</span>
              </button>
            </div>
            
            <div className="pd-chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.charts.trends}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} 
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '10px', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      backdropFilter: 'blur(16px)',
                      color: '#e2e8f0',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}
                    itemStyle={{ color: '#3B82F6', fontWeight: 600 }}
                    cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalConsumption" 
                    stroke="url(#trendGrad)" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#trendFill)" 
                    dot={false}
                    activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="pd-chart-legend">
              <span>Morning</span>
              <span>Afternoon</span>
              <span>Night</span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="pd-chart-card">
            <div className="pd-chart-header">
              <div className="pd-chart-header-left">
                <div className="pd-chart-icon pd-chart-icon-purple">
                  <LucideActivity size={18} />
                </div>
                <div>
                  <h3 className="pd-chart-title">Flow Balance</h3>
                  <p className="pd-chart-desc">Input vs output comparison</p>
                </div>
              </div>
            </div>
            <div className="pd-chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.comparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '10px', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: '#e2e8f0',
                      backdropFilter: 'blur(16px)'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 2, 2]} barSize={40} animationDuration={1500}>
                    {stats.charts.comparison.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Status Bar */}
      <FadeIn delay={0.35}>
        <div className="pd-status-bar">
          <div className="pd-status-item">
            <span className="pd-dot pd-dot-blue" />
            <span>Grid Stable</span>
          </div>
          <div className="pd-status-item">
            <span className="pd-dot pd-dot-green" />
            <span>Efficiency: 94.2%</span>
          </div>
          <div className="pd-status-item">
            <span className="pd-dot pd-dot-amber" />
            <span>Sync: 50.02 Hz</span>
          </div>
        </div>
      </FadeIn>

      <style jsx global>{`
        .pd-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ─── Loading ─── */
        .pd-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          height: 300px;
        }
        .pd-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59,130,246,0.15);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: pd-spin 0.8s linear infinite;
        }
        .pd-loading p {
          font-size: 13px;
          color: rgba(148,163,184,0.5);
          font-weight: 500;
        }

        /* ─── KPI Grid ─── */
        .pd-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .pd-kpi-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s ease;
        }
        .pd-kpi-card:hover {
          border-color: rgba(255,255,255,0.1);
        }
        .pd-kpi-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .pd-kpi-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-kpi-icon-blue { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #3b82f6; }
        .pd-kpi-icon-purple { background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2); color: #a855f7; }
        .pd-kpi-icon-amber { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #f59e0b; }

        .pd-kpi-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .pd-badge-green { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.15); }
        .pd-badge-red { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); }
        .pd-badge-purple { background: rgba(168,85,247,0.08); color: #a855f7; border: 1px solid rgba(168,85,247,0.15); }
        .pd-badge-amber { background: rgba(245,158,11,0.08); color: #f59e0b; border: 1px solid rgba(245,158,11,0.15); }

        .pd-kpi-value {
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 8px;
        }
        .pd-kpi-unit {
          font-size: 14px;
          font-weight: 700;
          margin-left: 6px;
        }
        .pd-unit-blue { color: #3b82f6; }
        .pd-unit-purple { color: #a855f7; }
        .pd-unit-amber { color: #f59e0b; }

        .pd-kpi-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(148,163,184,0.5);
        }

        .pd-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pd-dot-blue { background: #3b82f6; }
        .pd-dot-purple { background: #a855f7; }
        .pd-dot-amber { background: #f59e0b; }
        .pd-dot-green { background: #10b981; }

        /* ─── Charts ─── */
        .pd-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .pd-chart-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s ease;
        }
        .pd-chart-card:hover {
          border-color: rgba(255,255,255,0.1);
        }
        .pd-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .pd-chart-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pd-chart-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-chart-icon-blue { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.15); color: #3b82f6; }
        .pd-chart-icon-purple { background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.15); color: #a855f7; }

        .pd-chart-title {
          font-size: 15px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
        }
        .pd-chart-desc {
          font-size: 12px;
          color: rgba(148,163,184,0.4);
          font-weight: 500;
          margin-top: 1px;
        }
        .pd-chart-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(148,163,184,0.6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pd-chart-action:hover {
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
        }
        .pd-chart-body {
          height: 260px;
          width: 100%;
        }
        .pd-chart-legend {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding: 0 4px;
        }
        .pd-chart-legend span {
          font-size: 11px;
          color: rgba(148,163,184,0.3);
          font-weight: 500;
        }

        /* ─── Status Bar ─── */
        .pd-status-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          padding: 16px 24px;
          background: rgba(15,23,42,0.4);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 12px;
        }
        .pd-status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(148,163,184,0.5);
        }

        @keyframes pd-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .pd-kpi-grid {
            grid-template-columns: 1fr;
          }
          .pd-charts-grid {
            grid-template-columns: 1fr;
          }
          .pd-kpi-value {
            font-size: 28px;
          }
          .pd-status-bar {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
