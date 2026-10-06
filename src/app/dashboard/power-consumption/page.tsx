'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import PowerDashboard from '@/components/power/PowerDashboard';
import { LucidePlus, LucideFileText, LucideZap } from 'lucide-react';
import Link from 'next/link';
import FadeIn from '@/components/animations/FadeIn';

export default function PowerConsumptionPage() {
  return (
    <DashboardLayout title="Power Consumption" subtitle="TS-7 DRI Plant · Industrial Dashboard">
      <div className="pc-page">
        {/* Page Header */}
        <FadeIn>
          <div className="pc-header">
            <div className="pc-header-left">
              <div className="pc-header-icon">
                <LucideZap size={24} />
              </div>
              <div>
                <h2 className="pc-title">Power Consumption</h2>
                <p className="pc-subtitle">TS-7 DRI Plant · Live Analytics & Monitoring</p>
              </div>
            </div>
            <div className="pc-header-actions">
              <Link href="/dashboard/power-consumption/entry" className="pc-btn-primary">
                <LucidePlus size={16} />
                <span>New Reading</span>
              </Link>
              <Link href="/dashboard/power-consumption/reports" className="pc-btn-secondary">
                <LucideFileText size={16} />
                <span>Reports</span>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* Main Dashboard Content */}
        <PowerDashboard />
      </div>

      <style jsx global>{`
        .pc-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px 48px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .pc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .pc-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .pc-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
        }
        .pc-title {
          font-size: 22px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
          line-height: 1.2;
        }
        .pc-subtitle {
          font-size: 13px;
          color: rgba(148,163,184,0.6);
          font-weight: 500;
          margin-top: 2px;
        }
        .pc-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pc-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }
        .pc-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.35);
        }
        .pc-btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(148,163,184,0.8);
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .pc-btn-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          color: #e2e8f0;
        }
        @media (max-width: 640px) {
          .pc-header { flex-direction: column; align-items: flex-start; }
          .pc-title { font-size: 18px; }
          .pc-header-actions { width: 100%; }
          .pc-btn-primary, .pc-btn-secondary { flex: 1; justify-content: center; }
        }
      `}</style>
    </DashboardLayout>
  );
}
