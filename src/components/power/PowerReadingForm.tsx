'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateNetConsumption, formatPowerValue } from '@/lib/powerUtils';
import { queueRequest } from '@/lib/offlineDB';
import { LucideZap, LucideLayers, LucideSave, LucideInfo, LucideAlertTriangle, LucideCheck, LucideWifiOff } from 'lucide-react';
import FadeIn from '@/components/animations/FadeIn';

interface PowerReadingFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export default function PowerReadingForm({ initialData, onSuccess }: PowerReadingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [formData, setFormData] = useState({
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    incomer1: initialData?.incomer1 || 0,
    incomer2: initialData?.incomer2 || 0,
    outgoing1_TS12: initialData?.outgoing1_TS12 || 0,
    outgoing1_TS13: initialData?.outgoing1_TS13 || 0,
    outgoing1_TS19_24: initialData?.outgoing1_TS19_24 || 0,
    outgoing2_TS12: initialData?.outgoing2_TS12 || 0,
    outgoing2_TS13: initialData?.outgoing2_TS13 || 0,
    outgoing2_TS19_24: initialData?.outgoing2_TS19_24 || 0,
  });

  const [preview, setPreview] = useState(0);

  useEffect(() => {
    const net = calculateNetConsumption(formData);
    setPreview(net);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedOffline(false);

    try {
      const res = await fetch('/api/power-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save readings');

      router.refresh();
      if (onSuccess) onSuccess();
      else router.push('/dashboard/power-consumption');
    } catch (err: any) {
      // Check if offline — queue for later sync
      if (!navigator.onLine) {
        try {
          await queueRequest('/api/power-readings', 'POST', formData);
          setSavedOffline(true);
          setError(null);
        } catch {
          setError('Failed to save offline. Please try again.');
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prf-wrapper">
      <form onSubmit={handleSubmit} className="prf-form">

        {/* ─── Date Picker ─── */}
        <FadeIn>
          <div className="prf-card">
            <div className="prf-card-header">
              <span className="prf-card-label">Reading Date</span>
            </div>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="prf-input prf-date-input"
            />
          </div>
        </FadeIn>

        {/* ─── Two-column layout: Incomers + Outgoing ─── */}
        <div className="prf-grid-2">

          {/* Incomer Card */}
          <FadeIn delay={0.1}>
            <div className="prf-card">
              <div className="prf-card-header">
                <div className="prf-card-icon prf-icon-blue">
                  <LucideZap size={18} />
                </div>
                <div>
                  <span className="prf-card-label">Main Incomers</span>
                  <span className="prf-card-desc">Source power input readings</span>
                </div>
              </div>

              <div className="prf-field-group">
                <div className="prf-field">
                  <label className="prf-label">Meter Input 01 <span className="prf-unit">MWh</span></label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    name="incomer1"
                    value={formData.incomer1}
                    onChange={handleChange}
                    required
                    className="prf-input"
                    placeholder="0.000"
                  />
                </div>
                <div className="prf-field">
                  <label className="prf-label">Meter Input 02 <span className="prf-unit">MWh</span></label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    name="incomer2"
                    value={formData.incomer2}
                    onChange={handleChange}
                    required
                    className="prf-input"
                    placeholder="0.000"
                  />
                </div>
              </div>

              <div className="prf-notice prf-notice-blue">
                <LucideInfo size={15} />
                <p>Ensure readings reflect cumulative plant flow. Variance &gt; 5% triggers auto-audit.</p>
              </div>
            </div>
          </FadeIn>

          {/* Outgoing Feeders Card */}
          <FadeIn delay={0.15}>
            <div className="prf-card">
              <div className="prf-card-header">
                <div className="prf-card-icon prf-icon-amber">
                  <LucideLayers size={18} />
                </div>
                <div>
                  <span className="prf-card-label">Outgoing Feeders</span>
                  <span className="prf-card-desc">Distribution grid outputs</span>
                </div>
              </div>

              <div className="prf-field-grid">
                {[
                  { name: 'outgoing1_TS12', label: 'Out 1 · TS12' },
                  { name: 'outgoing2_TS12', label: 'Out 2 · TS12' },
                  { name: 'outgoing1_TS13', label: 'Out 1 · TS13' },
                  { name: 'outgoing2_TS13', label: 'Out 2 · TS13' },
                  { name: 'outgoing1_TS19_24', label: 'Out 1 · TS19-24' },
                  { name: 'outgoing2_TS19_24', label: 'Out 2 · TS19-24' },
                ].map((field) => (
                  <div key={field.name} className="prf-field">
                    <label className="prf-label">{field.label}</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      name={field.name}
                      value={(formData as any)[field.name]}
                      onChange={handleChange}
                      required
                      className="prf-input"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="prf-notice prf-notice-amber">
                <LucideInfo size={15} />
                <p>Record values in kWh as per plant feeder calibration data.</p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ─── Net Consumption + Submit ─── */}
        <FadeIn delay={0.25}>
          <div className="prf-result-card">
            <div className="prf-result-content">
              <div className="prf-result-info">
                <div className="prf-result-icon">
                  <LucideZap size={28} />
                </div>
                <div>
                  <span className="prf-result-label">Net Consumption</span>
                  <div className="prf-result-value">
                    <span className="prf-result-number">{formatPowerValue(preview)}</span>
                    <span className="prf-result-unit">kWh</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="prf-submit-btn"
              >
                {loading ? (
                  <div className="prf-btn-spinner" />
                ) : (
                  <>
                    <LucideSave size={18} />
                    <span>Save Reading</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </FadeIn>

        {/* ─── Error Message ─── */}
        {error && (
          <FadeIn>
            <div className="prf-error">
              <LucideAlertTriangle size={16} />
              <span>{error}</span>
            </div>
          </FadeIn>
        )}

        {/* ─── Offline Saved Message ─── */}
        {savedOffline && (
          <FadeIn>
            <div className="prf-offline-saved">
              <LucideWifiOff size={16} />
              <span>Saved offline — will sync automatically when connected</span>
            </div>
          </FadeIn>
        )}
      </form>

      <style jsx global>{`
        /* ─── Wrapper ─── */
        .prf-wrapper {
          display: flex;
          flex-direction: column;
        }
        .prf-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ─── Card ─── */
        .prf-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 28px;
          transition: border-color 0.2s ease;
        }
        .prf-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* ─── Card Header ─── */
        .prf-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }
        .prf-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .prf-icon-blue {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }
        .prf-icon-amber {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        .prf-card-label {
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1.3;
        }
        .prf-card-desc {
          display: block;
          font-size: 12px;
          color: rgba(148, 163, 184, 0.5);
          font-weight: 500;
          margin-top: 2px;
        }

        /* ─── Fields ─── */
        .prf-field-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .prf-field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .prf-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .prf-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.6);
          letter-spacing: 0.3px;
        }
        .prf-unit {
          font-size: 10px;
          color: rgba(59, 130, 246, 0.4);
          margin-left: 4px;
          font-weight: 500;
        }
        .prf-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #fff;
          padding: 12px 16px;
          font-size: 15px;
          font-weight: 600;
          width: 100%;
          outline: none;
          transition: all 0.2s ease;
          -moz-appearance: textfield;
        }
        .prf-input::-webkit-outer-spin-button,
        .prf-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .prf-input::placeholder {
          color: rgba(148, 163, 184, 0.2);
        }
        .prf-input:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .prf-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.03);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }
        .prf-date-input {
          max-width: 280px;
          cursor: pointer;
        }
        .prf-date-input::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
          cursor: pointer;
        }

        /* ─── Notice ─── */
        .prf-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.5;
          font-weight: 500;
        }
        .prf-notice svg {
          flex-shrink: 0;
          margin-top: 1px;
        }
        .prf-notice p {
          margin: 0;
        }
        .prf-notice-blue {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          color: rgba(148, 163, 184, 0.6);
        }
        .prf-notice-blue svg {
          color: rgba(59, 130, 246, 0.5);
        }
        .prf-notice-amber {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.1);
          color: rgba(148, 163, 184, 0.6);
        }
        .prf-notice-amber svg {
          color: rgba(245, 158, 11, 0.5);
        }

        /* ─── Two-column Grid ─── */
        .prf-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        /* ─── Result Card ─── */
        .prf-result-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.5));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        }
        .prf-result-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
        }
        .prf-result-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .prf-result-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
        }
        .prf-result-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .prf-result-value {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .prf-result-number {
          font-size: 40px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -2px;
          line-height: 1;
        }
        .prf-result-unit {
          font-size: 16px;
          font-weight: 700;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* ─── Submit Button ─── */
        .prf-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 36px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
          white-space: nowrap;
        }
        .prf-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.4);
        }
        .prf-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .prf-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ─── Button Spinner ─── */
        .prf-btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: prf-spin 0.7s linear infinite;
        }

        /* ─── Error ─── */
        .prf-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #f87171;
          font-size: 13px;
          font-weight: 600;
        }
        .prf-offline-saved {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          color: #6ee7b7;
          font-size: 13px;
          font-weight: 600;
        }

        @keyframes prf-spin {
          to { transform: rotate(360deg); }
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .prf-grid-2 {
            grid-template-columns: 1fr;
          }
          .prf-field-grid {
            grid-template-columns: 1fr 1fr;
          }
          .prf-result-content {
            flex-direction: column;
            align-items: stretch;
          }
          .prf-submit-btn {
            width: 100%;
          }
          .prf-result-number {
            font-size: 32px;
          }
          .prf-card {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          .prf-field-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
