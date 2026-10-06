'use client';

import { useState, useEffect, useCallback } from 'react';
import { LucideWifiOff, LucideWifi, LucideRefreshCw, LucideCheck, LucideX } from 'lucide-react';
import { getPendingCount } from '@/lib/offlineDB';
import { syncAndNotify, type SyncResult } from '@/lib/syncManager';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      // Auto-sync when coming back online
      handleSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync results from other sources
    const handleSyncComplete = (e: Event) => {
      const result = (e as CustomEvent).detail as SyncResult;
      setLastSyncResult(result);
      setShowResult(true);
      refreshPendingCount();
      setTimeout(() => setShowResult(false), 4000);
    };
    window.addEventListener('offline-sync-complete', handleSyncComplete);

    // Check pending count on mount and periodically
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-sync-complete', handleSyncComplete);
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  const handleSync = async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);
    try {
      const result = await syncAndNotify();
      setLastSyncResult(result);
      if (result.total > 0) {
        setShowResult(true);
        setTimeout(() => setShowResult(false), 4000);
      }
      await refreshPendingCount();
    } finally {
      setSyncing(false);
    }
  };

  // Don't render anything if online with no pending items and no active result
  if (isOnline && pendingCount === 0 && !showResult && !syncing) return null;
  if (dismissed && isOnline && pendingCount === 0) return null;

  return (
    <div className="oi-container">
      {/* Offline banner */}
      {!isOnline && (
        <div className="oi-banner oi-offline">
          <div className="oi-left">
            <LucideWifiOff size={16} />
            <span className="oi-text">You&apos;re offline</span>
            {pendingCount > 0 && (
              <span className="oi-badge">{pendingCount} pending</span>
            )}
          </div>
          <span className="oi-hint">Data will sync when connected</span>
        </div>
      )}

      {/* Online with pending items */}
      {isOnline && pendingCount > 0 && !showResult && (
        <div className="oi-banner oi-pending">
          <div className="oi-left">
            <LucideWifi size={16} />
            <span className="oi-text">{pendingCount} item{pendingCount > 1 ? 's' : ''} pending sync</span>
          </div>
          <button onClick={handleSync} disabled={syncing} className="oi-sync-btn">
            <LucideRefreshCw size={14} className={syncing ? 'oi-spinning' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      )}

      {/* Sync result */}
      {showResult && lastSyncResult && (
        <div className={`oi-banner ${lastSyncResult.failed > 0 ? 'oi-warning' : 'oi-success'}`}>
          <div className="oi-left">
            <LucideCheck size={16} />
            <span className="oi-text">
              Synced {lastSyncResult.synced}/{lastSyncResult.total}
              {lastSyncResult.failed > 0 ? ` · ${lastSyncResult.failed} failed` : ''}
            </span>
          </div>
          <button onClick={() => { setShowResult(false); setDismissed(true); }} className="oi-dismiss">
            <LucideX size={14} />
          </button>
        </div>
      )}

      <style jsx>{`
        .oi-container {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          pointer-events: none;
        }
        .oi-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 18px;
          border-radius: 12px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: all;
          animation: oi-slide-up 0.3s ease-out;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .oi-offline {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .oi-pending {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }
        .oi-success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }
        .oi-warning {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }
        .oi-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .oi-text {
          font-weight: 600;
        }
        .oi-hint {
          font-size: 12px;
          opacity: 0.6;
        }
        .oi-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.1);
          font-weight: 700;
        }
        .oi-sync-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.3);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #93c5fd;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .oi-sync-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.5);
        }
        .oi-sync-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .oi-dismiss {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: inherit;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .oi-dismiss:hover {
          background: rgba(255,255,255,0.2);
        }
        .oi-spinning {
          animation: oi-spin 0.7s linear infinite;
        }
        @keyframes oi-slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes oi-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .oi-container {
            left: 16px;
            right: 16px;
            transform: none;
          }
          .oi-banner {
            flex-wrap: wrap;
          }
          .oi-hint {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
