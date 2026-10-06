import { saveLocalState, getLocalState, queueSyncItem, getPendingSyncItems, removeSyncItem } from '../storage/indexedDb';

export interface AuthUser {
  id: string;
  phone: string;
  username: string;
  display_name: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
  last_login_at: string | null;
  assessment_data?: any;
  program_data?: any;
  current_week?: number;
  progress?: any;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private token: string | null = null;

  async init(): Promise<AuthUser | null> {
    // 1. Check local indexed state first for instant offline startup
    const cachedUser = await getLocalState<AuthUser>('auth_user');
    const cachedToken = await getLocalState<string>('auth_token');
    if (cachedUser) {
      this.currentUser = cachedUser;
      this.token = cachedToken;
    }

    // 2. If online, verify session with backend
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          this.currentUser = data.user;
          await saveLocalState('auth_user', data.user);
          return data.user;
        } else if (res.status === 401) {
          // Token expired or invalid
          this.currentUser = null;
          this.token = null;
          await saveLocalState('auth_user', null);
          await saveLocalState('auth_token', null);
        }
      } catch (err) {
        // Network error, keep cached offline user
      }
    }

    return this.currentUser;
  }

  getUser(): AuthUser | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin';
  }

  async register(phone: string, username: string, password: string, display_name?: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, username, password, display_name })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'خطا در ثبت‌نام.' };
      }

      this.currentUser = data.user;
      this.token = data.token;
      await saveLocalState('auth_user', data.user);
      await saveLocalState('auth_token', data.token);

      // Trigger automatic migration of existing local data
      this.migrateLocalDataToAccount();

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'خطای اتصال به سرور. اینترنت خود را بررسی کنید.' };
    }
  }

  async login(identifier: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'خطا در ورود.' };
      }

      this.currentUser = data.user;
      this.token = data.token;
      await saveLocalState('auth_user', data.user);
      await saveLocalState('auth_token', data.token);

      // Trigger migration/sync
      this.migrateLocalDataToAccount();

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'خطای اتصال به سرور. اینترنت خود را بررسی کنید.' };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    this.currentUser = null;
    this.token = null;
    await saveLocalState('auth_user', null);
    await saveLocalState('auth_token', null);
  }

  // Migrate anonymous localStorage data into the authenticated cloud database
  private async migrateLocalDataToAccount() {
    try {
      const localAssessment = localStorage.getItem('fitmax_assessment');
      const localProgram = localStorage.getItem('fitmax_program');
      const localWeek = localStorage.getItem('fitmax_current_week');
      const localLogs = localStorage.getItem('fitmax_workout_logs');

      const payload: any = {};
      if (localAssessment) payload.assessment_data = JSON.parse(localAssessment);
      if (localProgram) payload.program_data = JSON.parse(localProgram);
      if (localWeek) payload.current_week = Number(localWeek);
      if (localLogs) payload.workout_logs = JSON.parse(localLogs);

      if (Object.keys(payload).length > 0) {
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.warn('Migration warning:', err);
    }
  }
}

export const authService = new AuthService();
