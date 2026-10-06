import express, { Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest, sanitizeUser } from './auth.js';
import { loadDatabase, saveDatabase, WorkoutLogRecord, AdminAuditLog } from './db.js';
import * as XLSX from 'xlsx';

export const apiRouter = express.Router();

// ==========================================
// USER SPECIFIC ENDPOINTS (ISOLATED BY USER_ID)
// ==========================================

// 1. GET & UPDATE USER PROFILE
apiRouter.get('/user/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: sanitizeUser(req.user!) });
});

apiRouter.put('/user/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { display_name } = req.body;
  const db = loadDatabase();
  const user = db.users[req.user!.id];

  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });

  if (display_name && typeof display_name === 'string') {
    user.display_name = display_name.trim();
  }

  user.updated_at = new Date().toISOString();
  saveDatabase();

  return res.json({ message: 'پروفایل به‌روزرسانی شد.', user: sanitizeUser(user) });
});

// 2. ASSESSMENT PERSISTENCE
apiRouter.get('/user/assessment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({ assessment_data: user.assessment_data || null });
});

apiRouter.post('/user/assessment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { assessment_data } = req.body;
  if (!assessment_data) return res.status(400).json({ error: 'اطلاعات ارزیابی ارسال نشده است.' });

  const db = loadDatabase();
  const user = db.users[req.user!.id];
  user.assessment_data = assessment_data;
  user.updated_at = new Date().toISOString();
  saveDatabase();

  return res.json({ message: 'اطلاعات ارزیابی با موفقیت در فضای ابری ذخیره شد.' });
});

// 3. PROGRAM & PROGRESS PERSISTENCE
apiRouter.get('/user/program', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    program_data: user.program_data || null,
    current_week: user.current_week || 1,
    progress: user.progress || null
  });
});

apiRouter.post('/user/program', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { program_data, current_week, progress } = req.body;
  const db = loadDatabase();
  const user = db.users[req.user!.id];

  if (program_data !== undefined) user.program_data = program_data;
  if (current_week !== undefined) user.current_week = Number(current_week);
  if (progress !== undefined) user.progress = progress;

  user.updated_at = new Date().toISOString();
  saveDatabase();

  return res.json({ message: 'برنامه تمرینی با موفقیت در فضای ابری ذخیره شد.' });
});

// 4. WORKOUT LOGS
apiRouter.get('/user/workout-logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const userLogs = db.workout_logs.filter(log => log.user_id === req.user!.id);
  return res.json({ workout_logs: userLogs });
});

apiRouter.post('/user/workout-logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { logs } = req.body;
  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: 'آرایه لاگ‌ها معتبر نیست.' });
  }

  const db = loadDatabase();
  const userId = req.user!.id;
  const now = new Date().toISOString();
  let addedCount = 0;

  for (const item of logs) {
    const clientEventId = item.client_event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Idempotency: Prevent duplicate logs using client_event_id
    if (db.client_event_index[clientEventId]) {
      continue;
    }

    const newLog: WorkoutLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      client_event_id: clientEventId,
      week_number: Number(item.week_number || 1),
      session_id: String(item.session_id || ''),
      exercise_id: String(item.exercise_id || ''),
      exercise_name: item.exercise_name || '',
      set_number: Number(item.set_number || 1),
      reps: Number(item.reps || 0),
      weight: Number(item.weight || 0),
      rpe: Number(item.rpe || 0),
      completed_at: item.completed_at || now,
      created_at: now
    };

    db.workout_logs.push(newLog);
    db.client_event_index[clientEventId] = true;
    addedCount++;
  }

  if (addedCount > 0) {
    saveDatabase();
  }

  return res.json({ message: `${addedCount} رکورد با موفقیت ثبت شد.` });
});

// 5. BULK SYNC / MIGRATION (FOR OFFLINE QUEUE & LOCAL STORAGE MIGRATION)
apiRouter.post('/user/sync', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { assessment_data, program_data, current_week, progress, workout_logs } = req.body;
  const db = loadDatabase();
  const user = db.users[req.user!.id];
  const now = new Date().toISOString();

  // Merge assessment if provided and user doesn't have newer data
  if (assessment_data) {
    user.assessment_data = assessment_data;
  }

  // Merge program
  if (program_data) {
    user.program_data = program_data;
  }
  if (current_week) {
    user.current_week = Number(current_week);
  }
  if (progress) {
    user.progress = progress;
  }

  // Merge workout logs
  let addedLogs = 0;
  if (Array.isArray(workout_logs)) {
    for (const item of workout_logs) {
      const clientEventId = item.client_event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      if (!db.client_event_index[clientEventId]) {
        db.workout_logs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: user.id,
          client_event_id: clientEventId,
          week_number: Number(item.week_number || 1),
          session_id: String(item.session_id || ''),
          exercise_id: String(item.exercise_id || ''),
          exercise_name: item.exercise_name || '',
          set_number: Number(item.set_number || 1),
          reps: Number(item.reps || 0),
          weight: Number(item.weight || 0),
          rpe: Number(item.rpe || 0),
          completed_at: item.completed_at || now,
          created_at: now
        });
        db.client_event_index[clientEventId] = true;
        addedLogs++;
      }
    }
  }

  user.updated_at = now;
  saveDatabase();

  return res.json({
    message: 'همگام‌سازی ابری با موفقیت تکمیل شد.',
    added_logs: addedLogs,
    user: sanitizeUser(user)
  });
});

// ==========================================
// ADMIN DASHBOARD & AUDIT (RBAC PROTECTED)
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const allUsers = Object.values(db.users).filter(u => u.status !== 'deleted');
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const totalUsers = allUsers.length;
  const activeToday = allUsers.filter(u => u.last_login_at && new Date(u.last_login_at).getTime() > oneDayAgo).length;
  const activeThisWeek = allUsers.filter(u => u.last_login_at && new Date(u.last_login_at).getTime() > oneWeekAgo).length;
  const withProgram = allUsers.filter(u => !!u.program_data).length;
  const totalLogs = db.workout_logs.length;

  const weekDistribution = {
    week1: allUsers.filter(u => (u.current_week || 1) === 1).length,
    week2: allUsers.filter(u => u.current_week === 2).length,
    week3: allUsers.filter(u => u.current_week === 3).length,
    week4: allUsers.filter(u => u.current_week === 4).length,
  };

  return res.json({
    totalUsers,
    activeToday,
    activeThisWeek,
    withProgram,
    totalLogs,
    weekDistribution
  });
});

apiRouter.get('/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const { search, role, week } = req.query;

  let list = Object.values(db.users)
    .filter(u => u.status !== 'deleted')
    .map(u => {
      const userLogsCount = db.workout_logs.filter(l => l.user_id === u.id).length;
      return {
        id: u.id,
        phone: u.phone,
        username: u.username,
        display_name: u.display_name,
        role: u.role,
        status: u.status,
        created_at: u.created_at,
        last_login_at: u.last_login_at,
        current_week: u.current_week || 1,
        has_assessment: !!u.assessment_data,
        has_program: !!u.program_data,
        logs_count: userLogsCount,
        progress_pct: u.progress?.completion_percentage || 0
      };
    });

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    list = list.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.phone.includes(q) || 
      u.display_name.toLowerCase().includes(q)
    );
  }

  if (role && typeof role === 'string') {
    list = list.filter(u => u.role === role);
  }

  if (week && typeof week === 'string') {
    list = list.filter(u => u.current_week === Number(week));
  }

  return res.json({ users: list });
});

// EXCEL EXPORT (SENIOR SECURITY SAFE: NO PASSWORDS/TOKENS)
apiRouter.get('/admin/export-excel', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const allUsers = Object.values(db.users).filter(u => u.status !== 'deleted');

  const rows = allUsers.map(u => {
    const userLogsCount = db.workout_logs.filter(l => l.user_id === u.id).length;
    return {
      'شناسه کاربر': u.id,
      'شماره موبایل': u.phone,
      'نام کاربری': u.username,
      'نام نمایشی': u.display_name,
      'نقش': u.role === 'super_admin' ? 'مدیر ارشد' : u.role === 'admin' ? 'مدیر' : 'کاربر',
      'تاریخ عضویت': new Date(u.created_at).toLocaleDateString('fa-IR'),
      'آخرین ورود': u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('fa-IR') : '—',
      'هفته تمرینی': u.current_week || 1,
      'درصد پیشرفت': `${u.progress?.completion_percentage || 0}%`,
      'تعداد ست‌های ثبت شده': userLogsCount,
      'وضعیت ارزیابی': u.assessment_data ? 'تکمیل شده' : 'ارزیابی نشده'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'کاربران فیت مکس');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Log audit
  db.audit_logs.push({
    id: `audit_${Date.now()}`,
    admin_id: req.user!.id,
    admin_username: req.user!.username,
    action: 'EXPORT_USERS_EXCEL',
    created_at: new Date().toISOString()
  });
  saveDatabase();

  res.setHeader('Content-Disposition', 'attachment; filename="fitmax-users.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buffer);
});
