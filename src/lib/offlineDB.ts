// offlineDB.ts — IndexedDB queue for offline form submissions

const DB_NAME = 'elteam-offline';
const DB_VERSION = 1;
const STORE_NAME = 'outbox';

export interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  body: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retries: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueRequest(url: string, method: string, body: any): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: QueuedRequest = {
      url,
      method,
      body,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function removeRequest(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function updateRequestStatus(id: number, status: QueuedRequest['status']): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.status = status;
        if (status === 'failed') item.retries += 1;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getPendingCount(): Promise<number> {
  const items = await getQueuedRequests();
  return items.filter(i => i.status === 'pending' || i.status === 'failed').length;
}

export async function clearAllRequests(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
