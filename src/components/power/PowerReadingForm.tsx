'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateNetConsumption, formatPowerValue } from '@/lib/powerUtils';
import { LucideZap, LucideCalendar, LucideLayers, LucideSave } from 'lucide-react';

interface PowerReadingFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export default function PowerReadingForm({ initialData, onSuccess }: PowerReadingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Date Selection */}
        <div className="md:col-span-2 form-group">
          <label className="form-label flex items-center gap-2">
            <LucideCalendar className="w-4 h-4 text-accent-blue" />
            Reading Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* Incomers (MWh) */}
        <div className="card glass-panel" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <h3 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-blue-400 mb-6 font-black">
            <LucideZap className="w-5 h-5" />
            Incomer 1 & 2 (MWh)
          </h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label text-[10px]">Incomer 1 Reading</label>
              <input
                type="number"
                step="0.001"
                min="0"
                name="incomer1"
                value={formData.incomer1}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="0.000"
              />
            </div>
            <div className="form-group">
              <label className="form-label text-[10px]">Incomer 2 Reading</label>
              <input
                type="number"
                step="0.001"
                min="0"
                name="incomer2"
                value={formData.incomer2}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="0.000"
              />
            </div>
          </div>
        </div>

        {/* Outgoing Feeders (kWh) */}
        <div className="card glass-panel" style={{ background: 'rgba(245, 158, 11, 0.03)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
          <h3 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-amber-400 mb-6 font-black">
            <LucideLayers className="w-5 h-5" />
            Outgoing Feeders (kWh)
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="form-group">
              <label className="form-label text-[9px]">Out 1 - TS12</label>
              <input type="number" name="outgoing1_TS12" value={formData.outgoing1_TS12} onChange={handleChange} required className="form-input h-9 py-1 px-3 text-xs" />
            </div>
            <div className="form-group">
              <label className="form-label text-[9px]">Out 2 - TS12</label>
              <input type="number" name="outgoing2_TS12" value={formData.outgoing2_TS12} onChange={handleChange} required className="form-input h-9 py-1 px-3 text-xs" />
            </div>
            <div className="form-group">
              <label className="form-label text-[9px]">Out 1 - TS13</label>
              <input type="number" name="outgoing1_TS13" value={formData.outgoing1_TS13} onChange={handleChange} required className="form-input h-9 py-1 px-3 text-xs" />
            </div>
            <div className="form-group">
              <label className="form-label text-[9px]">Out 2 - TS13</label>
              <input type="number" name="outgoing2_TS13" value={formData.outgoing2_TS13} onChange={handleChange} required className="form-input h-9 py-1 px-3 text-xs" />
            </div>
            <div className="form-group">
              <label className="form-label text-[9px]">Out 1 - TS19-24</label>
              <input type="number" name="outgoing1_TS19_24" value={formData.outgoing1_TS19_24} onChange={handleChange} required className="form-input h-9 py-1 px-3 text-xs" />
            </div>
            <div className="form-group">
              <label className="form-label text-[9px]">Out 2 - TS19-24</label>
              <input type="number" name="outgoing2_TS19_24" value={formData.outgoing2_TS19_24} onChange={handleChange} required className="form-input h-9 py-1 px-3 text-xs" />
            </div>
          </div>
        </div>

        {/* Real-time Preview & Submit */}
        <div className="md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-900/60 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <LucideZap className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Net Consumption Calculation</p>
              <p className="text-4xl font-black text-white tracking-tighter">
                {formatPowerValue(preview)} <span className="text-sm font-bold text-blue-500 uppercase ml-1">kWh</span>
              </p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Processing...' : (
              <span className="flex items-center gap-2">
                <LucideSave className="w-4 h-4" />
                Submit Unit Reading
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="md:col-span-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">
            Error: {error}
          </div>
        )}
      </form>
    </div>
  );
}
