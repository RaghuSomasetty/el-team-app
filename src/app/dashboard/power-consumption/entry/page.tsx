'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PowerReadingForm from '@/components/power/PowerReadingForm';
import { LucideArrowLeft, LucideZap } from 'lucide-react';
import Link from 'next/link';
import FadeIn from '@/components/animations/FadeIn';

export default function PowerEntryPage() {
  return (
    <DashboardLayout title="New Reading" subtitle="TS-7 DRI · Energy Meter Entry">
      <div className="power-entry-page">
        {/* Page Header */}
        <FadeIn>
          <div className="pe-header">
            <div className="pe-header-left">
              <div className="pe-header-icon">
                <LucideZap className="pe-icon-zap" />
              </div>
              <div>
                <span className="pe-badge">Energy Meter Entry</span>
                <h2 className="pe-title">New Power Reading</h2>
                <p className="pe-subtitle">TS-7 DRI Plant · Daily Energy Accounting</p>
              </div>
            </div>
            <Link href="/dashboard/power-consumption" className="pe-back-btn">
              <LucideArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </FadeIn>

        {/* Form Content */}
        <Suspense fallback={
          <div className="pe-loading">
            <div className="pe-spinner" />
            <span>Loading form...</span>
          </div>
        }>
          <PowerReadingForm />
        </Suspense>

        {/* Footer */}
        <FadeIn delay={0.4}>
          <footer className="pe-footer">
            <div className="pe-footer-dot" />
            <p>Electrical Maintenance App · TS-7 DRI MIS System</p>
          </footer>
        </FadeIn>
      </div>

      <style jsx global>{`
        .power-entry-page {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 16px 48px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* ─── Header ─── */
        .pe-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .pe-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pe-header-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05));
          border: 1px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pe-icon-zap {
          width: 24px;
          height: 24px;
          color: #3b82f6;
        }
        .pe-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #3b82f6;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.15);
          padding: 3px 10px;
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .pe-title {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          line-height: 1.2;
          margin: 0;
        }
        .pe-subtitle {
          font-size: 13px;
          color: rgba(148,163,184,0.7);
          font-weight: 500;
          margin-top: 4px;
        }
        .pe-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(148,163,184,0.8);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .pe-back-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          color: #fff;
        }

        /* ─── Loading ─── */
        .pe-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          height: 300px;
          background: rgba(15,23,42,0.5);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
        }
        .pe-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59,130,246,0.15);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: pe-spin 0.8s linear infinite;
        }
        .pe-loading span {
          font-size: 13px;
          color: rgba(148,163,184,0.5);
          font-weight: 500;
        }

        /* ─── Footer ─── */
        .pe-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .pe-footer-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 8px rgba(59,130,246,0.4);
        }
        .pe-footer p {
          font-size: 11px;
          color: rgba(148,163,184,0.35);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        @keyframes pe-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .pe-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .pe-title {
            font-size: 20px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
