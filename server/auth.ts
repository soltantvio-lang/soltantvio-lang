import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { loadDatabase, saveDatabase, UserRecord } from './db.js';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fitmax_super_secret_jwt_key_2026_secure';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

// Token helper
export function generateToken(user: UserRecord): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Auth Middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.fitmax_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ error: 'احراز هویت الزامی است. لطفاً وارد شوید.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const db = loadDatabase();
    const user = db.users[decoded.id];

    if (!user || user.status === 'deleted') {
      return res.status(401).json({ error: 'کاربر یافت نشد یا غیرفعال شده است.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'نشست نامعتبر است یا منقضی شده است.' });
  }
}

// Admin Middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز. فقط مدیران سیستم مجاز هستند.' });
    }
    next();
  });
}

// Sanitize user for public response
export function sanitizeUser(user: UserRecord) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Rate Limiter Memory
const rateLimitMap: Record<string, { count: number; resetAt: number }> = {};
function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 15;

  if (!rateLimitMap[ip] || now > rateLimitMap[ip].resetAt) {
    rateLimitMap[ip] = { count: 1, resetAt: now + windowMs };
    return next();
  }

  rateLimitMap[ip].count += 1;
  if (rateLimitMap[ip].count > maxAttempts) {
    return res.status(429).json({ error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً یک دقیقه صبر کنید.' });
  }

  next();
}

// 1. REGISTER
authRouter.post('/register', rateLimit, async (req: Request, res: Response) => {
  try {
    const { phone, username, password, display_name } = req.body;

    if (!phone || !username || !password) {
      return res.status(400).json({ error: 'شماره موبایل، نام کاربری و رمز عبور الزامی هستند.' });
    }

    const cleanPhone = String(phone).trim().replace(/[^\d+]/g, '');
    const cleanUsername = String(username).trim().toLowerCase();

    if (cleanPhone.length < 10 || cleanPhone.length > 14) {
      return res.status(400).json({ error: 'فرمت شماره موبایل نامعتبر است (مثال: 09121234567).' });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'نام کاربری باید بین ۳ تا ۳۰ کاراکتر و شامل حروف انگلیسی، عدد یا آندرلاین باشد.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
    }

    const db = loadDatabase();

    // Unique phone check
    if (db.phone_index[cleanPhone]) {
      return res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت‌نام شده است.' });
    }

    // Unique username check
    if (db.username_index[cleanUsername]) {
      return res.status(409).json({ error: 'این نام کاربری قبلاً انتخاب شده است.' });
    }

    // Hash password with bcrypt salt 10
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const isFirstUser = Object.keys(db.users).length === 0;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newUser: UserRecord = {
      id: userId,
      phone: cleanPhone,
      username: cleanUsername,
      password_hash,
      display_name: (display_name && String(display_name).trim()) || cleanUsername,
      role: isFirstUser ? 'super_admin' : 'user',
      status: 'active',
      created_at: now,
      updated_at: now,
      last_login_at: now
    };

    db.users[userId] = newUser;
    db.phone_index[cleanPhone] = userId;
    db.username_index[cleanUsername] = userId;
    saveDatabase();

    const token = generateToken(newUser);

    res.cookie('fitmax_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.status(201).json({
      message: 'ثبت‌نام با موفقیت انجام شد.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'خطای سرور در ثبت‌نام کاربر.' });
  }
});

// 2. LOGIN
authRouter.post('/login', rateLimit, async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'نام کاربری/شماره موبایل و رمز عبور الزامی هستند.' });
    }

    const cleanIdentifier = String(identifier).trim().toLowerCase();
    const cleanPhone = cleanIdentifier.replace(/[^\d+]/g, '');

    const db = loadDatabase();
    let userId = db.username_index[cleanIdentifier] || db.phone_index[cleanPhone];

    if (!userId) {
      return res.status(401).json({ error: 'نام کاربری، شماره موبایل یا رمز عبور اشتباه است.' });
    }

    const user = db.users[userId];
    if (!user || user.status === 'deleted') {
      return res.status(401).json({ error: 'حساب کاربری یافت نشد یا حذف شده است.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'نام کاربری، شماره موبایل یا رمز عبور اشتباه است.' });
    }

    user.last_login_at = new Date().toISOString();
    user.updated_at = user.last_login_at;
    saveDatabase();

    const token = generateToken(user);

    res.cookie('fitmax_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: 'ورود موفقیت‌آمیز بود.',
      token,
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'خطای سرور در ورود کاربر.' });
  }
});

// 3. LOGOUT
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('fitmax_token');
  return res.json({ message: 'با موفقیت از حساب کاربری خارج شدید.' });
});

// 4. ME / SESSION VERIFY
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    user: sanitizeUser(req.user!)
  });
});
