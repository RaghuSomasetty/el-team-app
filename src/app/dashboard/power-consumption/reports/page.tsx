'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PowerAnalysis from '@/components/power/PowerAnalysis';
import { LucideArrowLeft, LucideDatabase } from 'lucide-react';
import Link from 'next/link';
import FadeIn from '@/components/animations/FadeIn';

export default function PowerReportsPage() {
  return (
    <DashboardLayout title="MIS Reports" subtitle="TS-7 DRI · Power Consumption Analysis">
      <div className="pr-page">
        {/* Page Header */}
        <FadeIn>
          <div className="pr-header">
            <div className="pr-header-left">
              <div className="pr-header-icon">
                <LucideDatabase size={22} />
              </div>
              <div>
                <span className="pr-badge">MIS Reports</span>
                <h2 className="pr-title">Historical Analysis</h2>
                <p className="pr-subtitle">Date-wise consumption data & export tools</p>
              </div>
            </div>
            <Link href="/dashboard/power-consumption" className="pr-back-btn">
              <LucideArrowLeft size={16} />
              <span>Back to Monitor</span>
            </Link>
          </div>
        </FadeIn>

        <Suspense fallback={
          <div className="pr-loading">
            <div className="pr-spinner" />
            <span>Loading analysis...</span>
          </div>
        }>
          <PowerAnalysis />
        </Suspense>

        {/* Footer */}
        <FadeIn delay={0.4}>
          <footer className="pr-footer">
            <div className="pr-footer-dot" />
            <p>Electrical Maintenance App · TS-7 DRI MIS System</p>
          </footer>
        </FadeIn>
      </div>

      <style jsx global>{`
        .pr-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .pr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .pr-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .pr-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
        }
        .pr-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #3b82f6;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.15);
          padding: 2px 8px;
          border-radius: 5px;
          margin-bottom: 4px;
        }
        .pr-title {
          font-size: 22px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
          line-height: 1.2;
        }
        .pr-subtitle {
          font-size: 13px;
          color: rgba(148,163,184,0.5);
          font-weight: 500;
          margin-top: 2px;
        }
        .pr-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(148,163,184,0.7);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .pr-back-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          color: #fff;
        }
        .pr-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          height: 300px;
          background: rgba(15,23,42,0.5);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
        }
        .pr-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59,130,246,0.15);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: pr-spin 0.8s linear infinite;
        }
        .pr-loading span {
          font-size: 13px;
          color: rgba(148,163,184,0.5);
          font-weight: 500;
        }
        .pr-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .pr-footer-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
        }
        .pr-footer p {
          font-size: 11px;
          color: rgba(148,163,184,0.3);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        @keyframes pr-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .pr-header { flex-direction: column; align-items: flex-start; }
          .pr-title { font-size: 18px; }
        }
      `}</style>
    </DashboardLayout>
  );
}
