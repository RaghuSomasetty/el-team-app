'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import PowerDashboard from '@/components/power/PowerDashboard';
import { LucidePlus, LucideFileText, LucideZap } from 'lucide-react';
import Link from 'next/link';

export default function PowerConsumptionPage() {
  return (
    <DashboardLayout title="Power Consumption" subtitle="TS-7 DRI Plant · Industrial Dashboard">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <LucideZap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">TS-7 DRI POWER MONITOR</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-0.5">Electrical Maintenance · Live Dashboard</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/power-consumption/entry"
              className="btn btn-primary flex items-center gap-2 shadow-xl shadow-blue-600/20"
            >
              <LucidePlus className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">New Reading</span>
            </Link>
            <Link
              href="/dashboard/power-consumption/reports"
              className="btn btn-secondary flex items-center gap-2"
            >
              <LucideFileText className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">Reports & Analysis</span>
            </Link>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <PowerDashboard />
      </div>
    </DashboardLayout>
  );
}
