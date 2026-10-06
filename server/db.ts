import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  phone: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  assessment_data?: any;
  program_data?: any;
  current_week?: number;
  progress?: {
    current_week: number;
    completed_sessions: number;
    total_sessions: number;
    completion_percentage: number;
  };
}

export interface WorkoutLogRecord {
  id: string;
  user_id: string;
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
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  target_user_id?: string;
  details?: any;
  created_at: string;
}

export interface DatabaseSchema {
  users: Record<string, UserRecord>; // id -> user
  phone_index: Record<string, string>; // phone -> user_id
  username_index: Record<string, string>; // lower(username) -> user_id
  workout_logs: WorkoutLogRecord[];
  client_event_index: Record<string, boolean>; // client_event_id -> true
  audit_logs: AdminAuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance: DatabaseSchema | null = null;

export function loadDatabase(): DatabaseSchema {
  if (dbInstance) return dbInstance;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(content);
      return dbInstance!;
    } catch (err) {
      console.error('Failed to parse database.json, initializing empty db:', err);
    }
  }

  dbInstance = {
    users: {},
    phone_index: {},
    username_index: {},
    workout_logs: [],
    client_event_index: {},
    audit_logs: []
  };

  saveDatabase();
  return dbInstance!;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbInstance, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}
