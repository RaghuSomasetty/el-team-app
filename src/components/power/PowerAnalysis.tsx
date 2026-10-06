'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LucideFileText, LucideTable, LucideRefreshCw, LucideZap, LucideCalendar, LucideTrendingUp } from 'lucide-react';
import { formatPowerValue } from '@/lib/powerUtils';
import { exportPowerToPDF, exportPowerToExcel } from '@/lib/exportUtils';
import FadeIn from '@/components/animations/FadeIn';

export default function PowerAnalysis() {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/power-readings?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const data = await res.json();
      setReadings(data);
    } catch (err) {
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [dateRange]);

  const handleExportPDF = () => {
    exportPowerToPDF(readings, {
      title: 'TS-7 DRI Power Consumption Report',
      subtitle: `${dateRange.startDate} to ${dateRange.endDate}`
    });
  };

  const handleExportExcel = () => {
    exportPowerToExcel(readings);
  };

  return (
    <div className="pa-wrapper">
      {/* Filter & Actions Bar */}
      <FadeIn>
        <div className="pa-filter-bar">
          <div className="pa-filter-dates">
            <div className="pa-filter-field">
              <label className="pa-filter-label">Start Date</label>
              <input 
                type="date" 
                className="pa-date-input"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="pa-filter-field">
              <label className="pa-filter-label">End Date</label>
              <input 
                type="date" 
                className="pa-date-input"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="pa-filter-actions">
            <button onClick={handleExportPDF} className="pa-export-btn">
              <LucideFileText size={15} className="pa-icon-red" />
              <span>PDF Report</span>
            </button>
            <button onClick={handleExportExcel} className="pa-export-btn">
              <LucideTable size={15} className="pa-icon-green" />
              <span>Excel Export</span>
            </button>
            <button onClick={fetchReadings} className="pa-refresh-btn" title="Refresh data">
              <LucideRefreshCw size={16} className={loading ? 'pa-spinning' : ''} />
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Data Table */}
      <FadeIn delay={0.15}>
        <div className="pa-table-card">
          <div className="pa-table-header">
            <div>
              <h3 className="pa-table-title">Consumption History</h3>
              <p className="pa-table-desc">Readings from the selected date range</p>
            </div>
            <span className="pa-record-count">{readings.length} records</span>
          </div>
          
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Incomer Total (MWh)</th>
                  <th className="pa-center">Net Daily (kWh)</th>
                  <th className="pa-center">Variance</th>
                  <th className="pa-center">Status</th>
                  <th className="pa-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="pa-skeleton-row">
                      <td colSpan={6}><div className="pa-skeleton" /></td>
                    </tr>
                  ))
                ) : readings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="pa-empty">
                      No readings found in the selected date range.
                    </td>
                  </tr>
                ) : (
                  readings.map((r) => {
                    const isPeak = r.totalConsumption > 4500;
                    return (
                      <tr key={r.id} className="pa-data-row">
                        <td>
                          <div className="pa-date-cell">
                            <LucideCalendar size={14} className="pa-date-icon" />
                            <span>{format(new Date(r.date), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td>
                          <span className="pa-incomer-val">{(r.incomer1 + r.incomer2).toFixed(3)}</span>
                          <span className="pa-incomer-unit">MWh</span>
                        </td>
                        <td className="pa-center">
                          <span className="pa-net-badge">
                            <LucideZap size={12} />
                            {formatPowerValue(r.totalConsumption)}
                          </span>
                        </td>
                        <td className="pa-center">
                          <span className={`pa-variance ${r.dailyConsumption <= 0 ? 'pa-var-green' : 'pa-var-amber'}`}>
                            {r.dailyConsumption > 0 ? <LucideTrendingUp size={11} /> : <LucideTrendingUp size={11} style={{ transform: 'rotate(180deg)' }} />}
                            {r.dailyConsumption > 0 ? '+' : ''}{r.dailyConsumption.toFixed(1)} kWh
                          </span>
                        </td>
                        <td className="pa-center">
                          <span className={`pa-status ${isPeak ? 'pa-status-peak' : 'pa-status-normal'}`}>
                            {isPeak ? 'Peak' : 'Normal'}
                          </span>
                        </td>
                        <td className="pa-center">
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <a
                              href={`/dashboard/power-consumption/entry?date=${format(new Date(r.date), 'yyyy-MM-dd')}`}
                              className="pa-edit-btn"
                              title="Edit this reading"
                            >
                              ✏️
                            </a>
                            <button
                              onClick={async () => {
                                if (!confirm(`Delete reading from ${format(new Date(r.date), 'dd MMM yyyy')}?`)) return;
                                const res = await fetch(`/api/power-readings?id=${r.id}`, { method: 'DELETE' });
                                if (res.ok) fetchReadings();
                                else alert('Failed to delete');
                              }}
                              className="pa-delete-btn"
                              title="Delete this reading"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>

      <style jsx global>{`
        .pa-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ─── Filter Bar ─── */
        .pa-filter-bar {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .pa-filter-dates {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pa-filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pa-filter-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(148,163,184,0.5);
        }
        .pa-date-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          outline: none;
          transition: all 0.2s ease;
          min-width: 160px;
        }
        .pa-date-input:focus {
          border-color: rgba(59,130,246,0.4);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
        .pa-date-input::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
          cursor: pointer;
        }
        .pa-filter-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pa-export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pa-export-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
        .pa-icon-red { color: #ef4444; }
        .pa-icon-green { color: #10b981; }
        .pa-refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          border: none;
          border-radius: 10px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }
        .pa-refresh-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37,99,235,0.35);
        }
        .pa-spinning { animation: pa-spin 0.7s linear infinite; }

        /* ─── Table Card ─── */
        .pa-table-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
        }
        .pa-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .pa-table-title {
          font-size: 16px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
        }
        .pa-table-desc {
          font-size: 12px;
          color: rgba(148,163,184,0.4);
          font-weight: 500;
          margin-top: 2px;
        }
        .pa-record-count {
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.15);
          padding: 4px 12px;
          border-radius: 20px;
        }

        /* ─── Table ─── */
        .pa-table-wrap { overflow-x: auto; }
        .pa-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 6px;
        }
        .pa-table th {
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(148,163,184,0.45);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .pa-table td {
          padding: 14px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .pa-table td:first-child {
          border-left: 1px solid rgba(255,255,255,0.03);
          border-radius: 10px 0 0 10px;
        }
        .pa-table td:last-child {
          border-right: 1px solid rgba(255,255,255,0.03);
          border-radius: 0 10px 10px 0;
        }
        .pa-data-row:hover td {
          background: rgba(255,255,255,0.04);
        }
        .pa-center { text-align: center; }
        .pa-right { text-align: right; }

        .pa-date-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pa-date-icon { color: rgba(59,130,246,0.5); }
        .pa-incomer-val {
          font-weight: 700;
          color: #93c5fd;
        }
        .pa-incomer-unit {
          font-size: 11px;
          color: rgba(148,163,184,0.4);
          margin-left: 4px;
        }
        .pa-net-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.15);
          border-radius: 8px;
          font-weight: 700;
          color: #e2e8f0;
          font-size: 13px;
        }
        .pa-net-badge svg { color: #3b82f6; }
        .pa-variance {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .pa-var-green { color: #10b981; }
        .pa-var-amber { color: #f59e0b; }

        .pa-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }
        .pa-status-normal {
          background: rgba(16,185,129,0.1);
          color: #10b981;
          border: 1px solid rgba(16,185,129,0.15);
        }
        .pa-status-peak {
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.15);
        }
        .pa-delete-btn {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #ef4444;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pa-delete-btn:hover {
          background: rgba(239,68,68,0.2);
        }
        .pa-edit-btn {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.2);
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .pa-edit-btn:hover {
          background: rgba(59,130,246,0.2);
        }

        /* ─── Skeleton / Empty ─── */
        .pa-skeleton-row td { padding: 8px 16px !important; }
        .pa-skeleton {
          height: 48px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          animation: pa-pulse 1.5s ease-in-out infinite;
        }
        .pa-empty {
          text-align: center !important;
          padding: 60px 16px !important;
          color: rgba(148,163,184,0.4) !important;
          font-size: 13px !important;
          border-radius: 10px !important;
          border: 1px dashed rgba(255,255,255,0.06) !important;
        }

        @keyframes pa-spin { to { transform: rotate(360deg); } }
        @keyframes pa-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .pa-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .pa-filter-dates {
            flex-direction: column;
          }
          .pa-filter-actions {
            justify-content: stretch;
          }
          .pa-export-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
