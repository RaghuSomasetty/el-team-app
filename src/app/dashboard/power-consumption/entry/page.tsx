'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PowerReadingForm from '@/components/power/PowerReadingForm';
import { LucideArrowLeft, LucideZap } from 'lucide-react';
import Link from 'next/link';

export default function PowerEntryPage() {
  return (
    <DashboardLayout title="New Reading" subtitle="TS-7 DRI · Energy Meter Entry">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <LucideZap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">ENERGY METER READING</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-0.5">Enter daily meter values for TS-7 DRI Plant</p>
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

        {/* Form Card */}
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)' }}>
          <Suspense fallback={
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Loading Form...</span>
              </div>
            </div>
          }>
            <PowerReadingForm />
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="pt-4 pb-2 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Electrical Maintenance App · TS-7 DRI MIS System
          </p>
        </footer>
      </div>
    </DashboardLayout>
  );
}
