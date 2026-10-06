import React, { useState } from 'react';
import { authService, AuthUser } from '../../services/authService';
import { User, Lock, Phone, UserCheck, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await authService.register(phone, username, password, displayName);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'ثبت‌نام ناموفق بود.');
        }
      } else {
        const res = await authService.login(identifier, password);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'ورود ناموفق بود.');
        }
      }
    } catch (err) {
      setError('خطای سیستمی رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 text-white/80 hover:text-white text-sm cursor-pointer"
          >
            ✕
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black">
            {mode === 'login' ? 'ورود به حساب فیت مکس' : 'ایجاد حساب کاربری جدید'}
          </h3>
          <p className="text-xs text-orange-100 mt-1">
            {mode === 'login'
              ? 'دسترسی ابری به برنامه‌ها، تاریخچه و رکوردهای تمرین'
              : 'ذخیره دائمی و همگام‌سازی بین وب و اپلیکیشن اندروید'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ورود به حساب
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              mode === 'register' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ثبت‌نام جدید
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام کاربری یا شماره موبایل
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="مثال: 09121234567 یا hossein_fit"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رمز عبور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شماره موبایل (یکتا)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام کاربری (انگلیسی و یکتا)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="fitmax_user"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام نمایشی (اختیاری)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: حسین رضایی"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رمز عبور (حداقل ۶ کاراکتر)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال پردازش...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'ورود به حساب' : 'تکمیل ثبت‌نام و ذخیره'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-500">
              داده‌های شما با استاندارد رمزنگاری امن در ابر ذخیره می‌شوند.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
