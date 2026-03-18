'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LucideFileText, LucideTable, LucideRefreshCw, LucideFilter, LucideZap } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="form-group mb-0">
            <label className="form-label text-[10px] text-blue-400 font-black tracking-widest">Start Period</label>
            <input 
              type="date" 
              className="form-input h-10 py-1" 
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-[10px] text-blue-400 font-black tracking-widest">End Period</label>
            <input 
              type="date" 
              className="form-input h-10 py-1" 
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleExportPDF} className="btn btn-secondary flex-1 md:flex-none h-11 px-6 shadow-lg shadow-blue-500/5 group">
            <LucideFileText className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-wider">PDF Export</span>
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary flex-1 md:flex-none h-11 px-6 shadow-lg shadow-emerald-500/5 group">
            <LucideTable className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-wider">Excel Export</span>
          </button>
          <button onClick={fetchReadings} className="btn btn-primary h-11 px-4 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
            <LucideRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card shadow-2xl overflow-hidden border-white/5" style={{ padding: 0 }}>
        <div className="bg-slate-800/50 p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <LucideFilter className="w-3 h-3 text-blue-500" />
            Historical Consumption Logs
          </h3>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            {readings.length} Recorded Units
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="w-32">Plant Date</th>
                <th>Incomer (MWh)</th>
                <th>Daily Total (kWh)</th>
                <th>Net Variance</th>
                <th>Efficiency Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Querying Power Records...</span>
                    </div>
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-24 text-slate-600 text-xs font-bold uppercase tracking-widest">
                    No energy readings discovered in the selected window.
                  </td>
                </tr>
              ) : (
                readings.map((r, i) => (
                  <tr key={r.id} className="group hover:bg-white/[0.02]">
                    <td className="font-bold text-white whitespace-nowrap">
                      {format(new Date(r.date), 'dd MMM yyyy')}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm text-blue-400 font-black">{(r.incomer1 + r.incomer2).toFixed(3)}</span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Combined Flow</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <LucideZap className="w-3 h-3 text-blue-500/50" />
                        <span className="text-sm font-black text-white">
                          {formatPowerValue(r.totalConsumption)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-black ${r.dailyConsumption <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {r.dailyConsumption > 0 ? '+' : ''}{r.dailyConsumption.toFixed(1)} kWh
                        </span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">vs previous day</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${r.totalConsumption > 4500 ? 'badge-amber' : 'badge-green'} px-3 py-0.5 uppercase text-[9px] font-black tracking-widest border border-current opacity-80 group-hover:opacity-100 transition-opacity`}>
                        {r.totalConsumption > 4500 ? 'Peak Load' : 'Nominal'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
