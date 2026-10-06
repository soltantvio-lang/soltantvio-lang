import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  RefreshCw, 
  Calendar, 
  Activity, 
  Dumbbell, 
  Award, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { authService } from '../../services/authService';

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  withProgram: number;
  totalLogs: number;
  weekDistribution: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
}

interface UserListItem {
  id: string;
  phone: string;
  username: string;
  display_name: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
  current_week: number;
  has_assessment: boolean;
  has_program: boolean;
  logs_count: number;
  progress_pct: number;
}

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { headers })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = authService.getToken();
      const res = await fetch('/api/admin/export-excel', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fitmax-users.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('خطا در دریافت خروجی اکسل.');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Layers className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              داشبورد مدیریت و کاربران فیت مکس
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            نظارت بر عملکرد کاربران، برنامه‌های تمرینی، وضعیت لاگ‌ها و استخراج گزارش
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="تازه‌سازی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'در حال آماده‌سازی...' : 'خروجی اکسل (Excel)'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-600">کل کاربران ثبت‌نامی</span>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 font-numeric">{stats.totalUsers}</div>
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
              {stats.activeToday} کاربر فعال امروز
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-600">دارای برنامه تمرینی</span>
              <Dumbbell className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 font-numeric">{stats.withProgram}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              برنامه هوشمند تولید شده
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-600">کل ست‌های ثبت‌شده</span>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 font-numeric">{stats.totalLogs}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              لاگ واقعی در سرور
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-600">توزیع هفته‌ها</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-xs font-bold text-slate-700 flex gap-2 mt-2">
              <span className="bg-orange-50 px-2 py-1 rounded-md text-orange-700">هفته ۱: {stats.weekDistribution.week1}</span>
              <span className="bg-amber-50 px-2 py-1 rounded-md text-amber-700">هفته ۲: {stats.weekDistribution.week2}</span>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm font-black text-slate-800">
            لیست کاربران سیستم ({users.length})
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو با نام کاربری یا موبایل..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">کاربر</th>
                <th className="p-3.5">شماره موبایل</th>
                <th className="p-3.5">نقش</th>
                <th className="p-3.5">هفته فعلی</th>
                <th className="p-3.5">ست‌های ثبت‌شده</th>
                <th className="p-3.5">تاریخ عضویت</th>
                <th className="p-3.5">آخرین ورود</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{u.display_name || u.username}</div>
                    <div className="text-[10px] text-slate-400">@{u.username}</div>
                  </td>
                  <td className="p-3.5 font-numeric text-slate-600">{u.phone}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'admin' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role === 'super_admin' ? 'مدیر ارشد' : u.role === 'admin' ? 'مدیر' : 'کاربر'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 font-bold text-orange-600">
                      هفته {u.current_week}
                    </span>
                  </td>
                  <td className="p-3.5 font-numeric font-bold text-slate-800">
                    {u.logs_count} ست
                  </td>
                  <td className="p-3.5 text-slate-500 font-numeric">
                    {new Date(u.created_at).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="p-3.5 text-slate-500 font-numeric">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('fa-IR') : '—'}
                  </td>
                </tr>
              ))}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    کاربری با این مشخصات یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
