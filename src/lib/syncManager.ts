// syncManager.ts — Replays queued offline requests when connectivity returns

import { getQueuedRequests, removeRequest, updateRequestStatus, type QueuedRequest } from './offlineDB';

export interface SyncResult {
  synced: number;
  failed: number;
  total: number;
}

let isSyncing = false;

export async function syncPendingRequests(): Promise<SyncResult> {
  if (isSyncing) return { synced: 0, failed: 0, total: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0, total: 0 };

  isSyncing = true;
  const result: SyncResult = { synced: 0, failed: 0, total: 0 };

  try {
    const queued = await getQueuedRequests();
    const pending = queued.filter(r => r.status === 'pending' || r.status === 'failed');
    result.total = pending.length;

    if (pending.length === 0) {
      isSyncing = false;
      return result;
    }

    // Sort by timestamp — oldest first
    pending.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of pending) {
      try {
        await updateRequestStatus(item.id!, 'syncing');

        const res = await fetch(item.url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body),
        });

        if (res.ok) {
          await removeRequest(item.id!);
          result.synced++;
        } else {
          // Server rejected it — mark failed but keep for retry
          await updateRequestStatus(item.id!, 'failed');
          result.failed++;
        }
      } catch {
        // Network still unreliable — mark failed
        await updateRequestStatus(item.id!, 'failed');
        result.failed++;
      }
    }
  } catch (err) {
    console.error('[SyncManager] Error during sync:', err);
  } finally {
    isSyncing = false;
  }

  return result;
}

// Broadcast sync result to any listening components
export function notifySyncResult(result: SyncResult) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('offline-sync-complete', { detail: result }));
}

// Convenience: sync + notify
export async function syncAndNotify(): Promise<SyncResult> {
  const result = await syncPendingRequests();
  if (result.total > 0) {
    notifySyncResult(result);
  }
  return result;
}
