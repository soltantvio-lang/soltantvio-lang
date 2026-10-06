import { authService } from './authService';
import { saveLocalState, getLocalState, queueSyncItem, getPendingSyncItems, removeSyncItem } from '../storage/indexedDb';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'offline';

class SyncService {
  private status: SyncStatus = navigator.onLine ? 'synced' : 'offline';
  private listeners: ((status: SyncStatus) => void)[] = [];
  private syncTimer: any = null;

  constructor() {
    window.addEventListener('online', () => {
      this.setStatus('syncing');
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.setStatus('offline');
    });

    // Periodic sync attempt every 30 seconds if online
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && authService.isAuthenticated()) {
        this.flushQueue();
      }
    }, 30000);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private setStatus(s: SyncStatus) {
    this.status = s;
    this.listeners.forEach(l => l(s));
  }

  // Flush offline queue to cloud server
  async flushQueue(): Promise<void> {
    if (!navigator.onLine || !authService.isAuthenticated()) {
      this.setStatus(navigator.onLine ? 'synced' : 'offline');
      return;
    }

    const items = await getPendingSyncItems();
    if (items.length === 0) {
      this.setStatus('synced');
      return;
    }

    this.setStatus('syncing');
    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    for (const item of items) {
      try {
        let endpoint = '/api/user/sync';
        let body = {};

        if (item.type === 'assessment') {
          endpoint = '/api/user/assessment';
          body = { assessment_data: item.payload };
        } else if (item.type === 'program') {
          endpoint = '/api/user/program';
          body = item.payload;
        } else if (item.type === 'workout_log') {
          endpoint = '/api/user/workout-logs';
          body = { logs: Array.isArray(item.payload) ? item.payload : [item.payload] };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (res.ok) {
          await removeSyncItem(item.id);
        }
      } catch (err) {
        console.warn('Sync queue flush item error:', err);
      }
    }

    const remaining = await getPendingSyncItems();
    this.setStatus(remaining.length > 0 ? 'pending' : 'synced');
  }

  // Save Workout Log (Offline first + Background Sync)
  async saveWorkoutLog(log: any): Promise<void> {
    const clientEventId = log.client_event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const enrichedLog = { ...log, client_event_id: clientEventId };

    // 1. Save to local state immediately
    const existingLogs = (await getLocalState<any[]>('workout_logs')) || [];
    existingLogs.push(enrichedLog);
    await saveLocalState('workout_logs', existingLogs);

    // Also sync with localStorage for backward compat
    try {
      localStorage.setItem('fitmax_workout_logs', JSON.stringify(existingLogs));
    } catch {}

    // 2. Queue for cloud sync
    if (navigator.onLine && authService.isAuthenticated()) {
      try {
        const token = authService.getToken();
        await fetch('/api/user/workout-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ logs: [enrichedLog] })
        });
        this.setStatus('synced');
        return;
      } catch (err) {
        // Fallback to queue
      }
    }

    await queueSyncItem('workout_log', enrichedLog);
    this.setStatus('pending');
  }

  // Save Program (Offline first + Background Sync)
  async saveProgram(program: any, currentWeek: number, progress?: any): Promise<void> {
    await saveLocalState('program_data', program);
    await saveLocalState('current_week', currentWeek);
    if (progress) await saveLocalState('progress', progress);

    try {
      localStorage.setItem('fitmax_program', JSON.stringify(program));
      localStorage.setItem('fitmax_current_week', String(currentWeek));
    } catch {}

    if (navigator.onLine && authService.isAuthenticated()) {
      try {
        const token = authService.getToken();
        await fetch('/api/user/program', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ program_data: program, current_week: currentWeek, progress })
        });
        this.setStatus('synced');
        return;
      } catch {}
    }

    await queueSyncItem('program', { program_data: program, current_week: currentWeek, progress });
    this.setStatus('pending');
  }

  // Save Assessment (Offline first + Background Sync)
  async saveAssessment(assessment: any): Promise<void> {
    await saveLocalState('assessment_data', assessment);
    try {
      localStorage.setItem('fitmax_assessment', JSON.stringify(assessment));
    } catch {}

    if (navigator.onLine && authService.isAuthenticated()) {
      try {
        const token = authService.getToken();
        await fetch('/api/user/assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ assessment_data: assessment })
        });
        this.setStatus('synced');
        return;
      } catch {}
    }

    await queueSyncItem('assessment', assessment);
    this.setStatus('pending');
  }
}

export const syncService = new SyncService();
