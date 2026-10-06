import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FitMaxDB extends DBSchema {
  user_state: {
    key: string;
    value: any;
  };
  workout_logs: {
    key: string;
    value: {
      id: string;
      client_event_id: string;
      week_number: number;
      session_id: string;
      exercise_id: string;
      exercise_name?: string;
      set_number: number;
      reps: number;
      weight: number;
      rpe: number;
      completed_at: string;
      synced: boolean;
    };
    indexes: { 'by-synced': number };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      type: 'assessment' | 'program' | 'workout_log' | 'progress';
      payload: any;
      created_at: string;
      retry_count: number;
    };
  };
}

const DB_NAME = 'fitmax_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FitMaxDB>> | null = null;

export function getIndexedDB(): Promise<IDBPDatabase<FitMaxDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FitMaxDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('user_state')) {
          db.createObjectStore('user_state');
        }
        if (!db.objectStoreNames.contains('workout_logs')) {
          const logStore = db.createObjectStore('workout_logs', { keyPath: 'id' });
          logStore.createIndex('by-synced', 'synced');
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
}

export async function saveLocalState(key: string, value: any): Promise<void> {
  try {
    const db = await getIndexedDB();
    await db.put('user_state', value, key);
  } catch (err) {
    console.error(`IndexedDB saveLocalState error [${key}]:`, err);
    try {
      localStorage.setItem(`fitmax_idb_${key}`, JSON.stringify(value));
    } catch {}
  }
}

export async function getLocalState<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getIndexedDB();
    const result = await db.get('user_state', key);
    if (result !== undefined) return result as T;
  } catch (err) {
    console.error(`IndexedDB getLocalState error [${key}]:`, err);
  }

  try {
    const fallback = localStorage.getItem(`fitmax_idb_${key}`);
    return fallback ? JSON.parse(fallback) : null;
  } catch {
    return null;
  }
}

export async function queueSyncItem(type: 'assessment' | 'program' | 'workout_log' | 'progress', payload: any): Promise<void> {
  try {
    const db = await getIndexedDB();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.put('sync_queue', {
      id,
      type,
      payload,
      created_at: new Date().toISOString(),
      retry_count: 0
    });
  } catch (err) {
    console.error('Failed to queue sync item in IndexedDB:', err);
  }
}

export async function getPendingSyncItems() {
  try {
    const db = await getIndexedDB();
    return await db.getAll('sync_queue');
  } catch (err) {
    return [];
  }
}

export async function removeSyncItem(id: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    await db.delete('sync_queue', id);
  } catch (err) {}
}
