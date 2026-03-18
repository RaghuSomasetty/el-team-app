'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PowerAnalysis from '@/components/power/PowerAnalysis';
import { LucideArrowLeft, LucideDatabase } from 'lucide-react';
import Link from 'next/link';

export default function PowerReportsPage() {
  return (
    <DashboardLayout title="MIS Reports" subtitle="TS-7 DRI · Power Consumption Analysis">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-700/50 border border-white/5 flex items-center justify-center">
              <LucideDatabase className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">REPORTS & ANALYSIS</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-0.5">Date-wise power consumption analysis for TS-7 DRI</p>
            </div>
          </div>

          <Link
            href="/dashboard/power-consumption"
            className="btn btn-secondary flex items-center gap-2"
          >
            <LucideArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">Back to Dashboard</span>
          </Link>
        </div>

        <Suspense fallback={
          <div className="h-96 flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Analyzing database...</span>
            </div>
          </div>
        }>
          <PowerAnalysis />
        </Suspense>

        <footer className="pt-4 pb-2 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Electrical Maintenance App · Official TS-7 DRI MIS System
          </p>
        </footer>
      </div>
    </DashboardLayout>
  );
}
