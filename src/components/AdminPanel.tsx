import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Dumbbell, 
  Youtube, 
  Bot, 
  MessageSquare, 
  Users, 
  ShoppingBag, 
  Settings, 
  Palette, 
  Activity, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  Save, 
  AlertTriangle,
  Send,
  FolderOpen,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { EXERCISES_DATABASE } from '../data/exercises';

const DEFAULT_WORKOUT_PROGRAMS = [
  {
    id: 'prog_beginner_home_3d',
    title_fa: 'برنامه پایه کلیستنیکس مبتدی (۳ روز در هفته)',
    level_fa: 'مبتدی (Beginner)',
    description_fa: 'مناسب برای شروع کلیستنیکس و تمرینات وزن بدن در خانه بدون نیاز به تجهیزات.',
    days_per_week: 3,
    location_fa: 'خانه / پارک'
  },
  {
    id: 'prog_inter_pullup_4d',
    title_fa: 'برنامه افزایش حجم سینه و ساخت V-Shape (۴ روز در هفته)',
    level_fa: 'متوسط (Intermediate)',
    description_fa: 'افزایش قدرت عضلات سینه، زیربغل، شانه و بازو با تکنیک‌های پیشرفته وزن بدن.',
    days_per_week: 4,
    location_fa: 'خانه با میله بارفیکس'
  },
  {
    id: 'prog_advanced_calisthenics_5d',
    title_fa: 'مسترکلاس کنترل بدن و مهارت‌های کلیستنیکس (۵ روز در هفته)',
    level_fa: 'پیشرفته (Advanced)',
    description_fa: 'تمرکز بر تکنیک‌های فرانت لور، دیپس موازی، شنا الماسی و بالانس روی دست.',
    days_per_week: 5,
    location_fa: 'پارک کلیستنیکس / باشگاه'
  }
];

interface AdminPanelProps {
  onCloseAdmin?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onCloseAdmin }) => {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('fitmax_admin_token'));
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [loginUsernameInput, setLoginUsernameInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'cms' | 'media' | 'pages' | 'workouts' | 'exercises' | 'youtube' | 'ai' | 'comments' | 'users' | 'products' | 'settings' | 'appearance' | 'security' | 'audit' | 'backup'
  >('dashboard');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------
  // FETCH DATA STORES
  // ---------------------------------------------------------
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>({
    siteName: 'FIT MAX | فیت مکس',
    logoUrl: '/images/site/logo.png',
    siteDescription: 'پلتفرم علمی و آموزشی تخصصی کلیستنیکس و تمرینات وزن بدن.',
    youtubeUrl: 'https://youtube.com/@fitmaxofficial',
    telegramAdminHandle: '@FitMax_Admin',
    contactPhone: '۰۲۱-۸۸۹۹۰۰۱۱',
    contactEmail: 'info@fitmaxofficial.ir',
    footerText: '© ۲۰۲۶ FIT MAX | تمامی حقوق مادی و معنوی محفوظ است.'
  });
  const [appearanceSettings, setAppearanceSettings] = useState<any>({
    primaryColor: '#f97316',
    backgroundColor: '#ffead9',
    textColor: '#0f172a'
  });
  const [typographySettings, setTypographySettings] = useState<any>({
    headerFont: 'Vazirmatn',
    bodyFont: 'Vazirmatn'
  });
  const [comments, setComments] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [aiKnowledge, setAiKnowledge] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);

  // Modals & Form States
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exercisesList, setExercisesList] = useState<any[]>(EXERCISES_DATABASE);

  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoCategoryInput, setVideoCategoryInput] = useState('pullups');

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(190000);
  const [newProdCategory, setNewProdCategory] = useState('course');

  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaFilenameInput, setMediaFilenameInput] = useState('');
  const [mediaFolderInput, setMediaFolderInput] = useState('exercises');

  const [isAddingAIKnowledge, setIsAddingAIKnowledge] = useState(false);
  const [aiTitleInput, setAiTitleInput] = useState('');
  const [aiContentInput, setAiContentInput] = useState('');

  // Password Change State
  const [currPassChange, setCurrPassChange] = useState('');
  const [newUserChange, setNewUserChange] = useState('');
  const [newPassChange, setNewPassChange] = useState('');

  // ---------------------------------------------------------
  // INITIAL VERIFICATION & LOAD
  // ---------------------------------------------------------
  useEffect(() => {
    if (token) {
      verifyTokenAndFetchData();
    }
  }, [token]);

  const verifyTokenAndFetchData = async () => {
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'x-admin-token': token || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsername(data.username || 'admin');
        fetchAllAdminStores();
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error('Verify error:', e);
    }
  };

  const fetchAllAdminStores = () => {
    const headers = { 'x-admin-token': token || '' };

    fetch('/api/admin/dashboard-stats', { headers })
      .then(res => res.json())
      .then(setDashboardStats)
      .catch(() => {});

    fetch('/api/admin/site-settings', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.siteSettings) setSiteSettings(data.siteSettings);
        if (data.appearanceSettings) setAppearanceSettings(data.appearanceSettings);
        if (data.typographySettings) setTypographySettings(data.typographySettings);
      })
      .catch(() => {});

    fetch('/api/admin/comments', { headers })
      .then(res => res.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/admin/media', { headers })
      .then(res => res.json())
      .then(data => setMediaFiles(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/admin/youtube', { headers })
      .then(res => res.json())
      .then(data => setYoutubeVideos(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/admin/products', { headers })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/admin/ai-coach-knowledge', { headers })
      .then(res => res.json())
      .then(data => setAiKnowledge(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/admin/users', { headers })
      .then(res => res.json())
      .then(data => setRegisteredUsers(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/admin/activity-logs', { headers })
      .then(res => res.json())
      .then(data => setAuditLogs(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/admin/banners', { headers })
      .then(res => res.json())
      .then(data => setHeroBanners(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // ---------------------------------------------------------
  // LOGIN & LOGOUT HANDLERS
  // ---------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsernameInput,
          password: loginPasswordInput
        })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('fitmax_admin_token', data.token);
        setToken(data.token);
        setAdminUsername(data.username);
        showToast('ورود با موفقیت انجام شد. خوش آمدید مدیر عزیز!');
      } else {
        setLoginError(data.error || 'اطلاعات ورود اشتباه است.');
      }
    } catch (err) {
      setLoginError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'x-admin-token': token }
        });
      } catch (e) {}
    }
    localStorage.removeItem('fitmax_admin_token');
    setToken(null);
    showToast('شما با موفقیت از سیستم مدیریت خارج شدید.');
  };

  // ---------------------------------------------------------
  // FORM ACTIONS (CREATE / EDIT / DELETE)
  // ---------------------------------------------------------

  // Comment Actions
  const handleUpdateCommentStatus = async (commentId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/comments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        body: JSON.stringify({ comment_id: commentId, status })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        showToast(`وضعیت دیدگاه تغییر کرد به: ${status === 'approved' ? 'تایید شده' : 'رد شده'}`);
      }
    } catch (e) {
      showToast('خطا در تغییر وضعیت دیدگاه', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('آیا از حذف این دیدگاه اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        showToast('دیدگاه با موفقیت حذف شد.');
      }
    } catch (e) {
      showToast('خطا در حذف دیدگاه', 'error');
    }
  };

  // YouTube Actions
  const handleAddYouTubeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput || !videoTitleInput) return;

    try {
      const res = await fetch('/api/admin/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        body: JSON.stringify({
          youtube_id: videoUrlInput,
          title_fa: videoTitleInput,
          category: videoCategoryInput,
          description_fa: 'ویدئوی آموزشی رسمی کانال یوتیوب Fit Max',
          duration: '12:00',
          featured: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setYoutubeVideos(data.youtubeVideos || []);
        setIsAddingVideo(false);
        setVideoUrlInput('');
        setVideoTitleInput('');
        showToast('ویدیوی جدید با موفقیت اضافه شد!');
      }
    } catch (e) {
      showToast('خطا در افزودن ویدیو', 'error');
    }
  };

  const handleDeleteYouTubeVideo = async (id: string) => {
    if (!window.confirm('آیا از حذف این ویدیو اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/admin/youtube/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setYoutubeVideos(data.youtubeVideos || []);
        showToast('ویدیو حذف گردید.');
      }
    } catch (e) {
      showToast('خطا در حذف ویدیو', 'error');
    }
  };

  // Product Actions
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle) return;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        body: JSON.stringify({
          title_fa: newProdTitle,
          description_fa: 'دوره و محصول تخصصی آموزشی فیت مکس',
          price_toman: Number(newProdPrice),
          is_free: Number(newProdPrice) === 0,
          category: newProdCategory,
          features_fa: ['دسترسی کامل ویدئویی', 'پشتیبانی مستقیم تلگرام'],
          image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setIsAddingProduct(false);
        setNewProdTitle('');
        showToast('محصول جدید اضافه شد!');
      }
    } catch (e) {
      showToast('خطا در افزودن محصول', 'error');
    }
  };

  // Media File Upload
  const handleAddMediaFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrlInput || !mediaFilenameInput) return;

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        body: JSON.stringify({
          filename: mediaFilenameInput,
          folder: mediaFolderInput,
          url: mediaUrlInput,
          alt_text: mediaFilenameInput,
          size_kb: 210
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(data.mediaFiles || []);
        setIsAddingMedia(false);
        setMediaUrlInput('');
        setMediaFilenameInput('');
        showToast('تصویر جدید در گالری ثبت شد.');
      }
    } catch (e) {
      showToast('خطا در ثبت تصویر', 'error');
    }
  };

  // Save Site Settings
  const handleSaveSiteSettings = async () => {
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        body: JSON.stringify({
          newSiteSettings: siteSettings,
          newAppearance: appearanceSettings,
          newTypography: typographySettings
        })
      });
      if (res.ok) {
        showToast('تنظیمات کلیدی، ظاهر و فونت سایت با موفقیت ذخیره شد.');
      }
    } catch (e) {
      showToast('خطا در ذخیره تنظیمات', 'error');
    }
  };

  // Credentials Change
  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPassChange || !newUserChange || !newPassChange) return;

    try {
      const res = await fetch('/api/admin/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        body: JSON.stringify({
          currentPassword: currPassChange,
          newUsername: newUserChange,
          newPassword: newPassChange
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminUsername(newUserChange);
        setCurrPassChange('');
        setNewUserChange('');
        setNewPassChange('');
        showToast('نام کاربری و رمز عبور مدیریت با موفقیت بروزرسانی شد.');
      } else {
        showToast(data.error || 'خطا در تغییر رمز عبور', 'error');
      }
    } catch (e) {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    }
  };

  // Backup Export
  const handleExportBackup = () => {
    window.open('/api/admin/export', '_blank');
    showToast('در حال دانلود خروجی پشتیبان JSON...');
  };

  // ---------------------------------------------------------
  // RENDER UNAUTHENTICATED LOGIN SCREEN
  // ---------------------------------------------------------
  if (!token) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
          {/* Subtle Ambient Gradient */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>پنل مدیریت اختصاصی FIT MAX</span>
            </div>
            <h1 className="text-2xl font-black text-white pt-2">ورود به سیستم مدیریت رسمی</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              جهت ورود، نام کاربری و رمز عبور مدیر سایت را وارد کنید.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>نام کاربری مدیر</span>
              </label>
              <input
                type="text"
                required
                value={loginUsernameInput}
                onChange={(e) => setLoginUsernameInput(e.target.value)}
                placeholder="نام کاربری (پیش‌فرض: admin)"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>رمز عبور مدیریت</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPasswordInput}
                  onChange={(e) => setLoginPasswordInput(e.target.value)}
                  placeholder="رمز عبور (پیش‌فرض: 1234)"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال اعتبارسنجی ورود...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ورود امن به پنل مدیریت</span>
                </>
              )}
            </button>
          </form>

          {/* Credentials Guidance Note */}
          <div className="pt-4 border-t border-slate-700/60 text-center text-[11px] text-slate-400 space-y-1">
            <p>اطلاعات ورود اولیه: نام کاربری: <span className="font-mono text-amber-400 font-bold">admin</span> | رمز: <span className="font-mono text-amber-400 font-bold">1234</span></p>
            <p className="text-[10px] text-slate-500">قابلیت تغییر نام کاربری و رمز عبور پس از ورود در بخش تنظیمات فراهم است.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER AUTHENTICATED ADMIN DASHBOARD
  // ---------------------------------------------------------
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ADMIN TOP BAR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
            FM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">پنل مدیریت FIT MAX</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                نسخه ۲.۵ فعال
              </span>
            </div>
            <p className="text-[10px] text-slate-400">ورود با نام کاربری: <span className="text-amber-400 font-bold">{adminUsername}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCloseAdmin && (
            <button
              onClick={onCloseAdmin}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>بازگشت به سایت اصلی</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT WITH SIDEBAR */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 bg-slate-900/90 border-b md:border-b-0 md:border-l border-slate-800 p-4 space-y-1 shrink-0 overflow-y-auto max-h-[calc(100vh-60px)] sticky top-[60px]">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1 pt-2">
            بخش‌های اصلی مدیریت
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>داشبورد و آمار کلی</span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'cms' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مدیریت محتوا (CMS)</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'media' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>تصاویر و پوشه‌ها ({mediaFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pages')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'pages' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مدیریت صفحات سایت</span>
          </button>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1 pt-3">
            داده‌ها و تمرینات
          </div>

          <button
            onClick={() => setActiveTab('workouts')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'workouts' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>برنامه‌های تمرینی</span>
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'exercises' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>کتابخانه حرکات ({exercisesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('youtube')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'youtube' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Youtube className="w-4 h-4 text-red-500" />
            <span>مدیریت ویدیوهای یوتیوب</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 text-sky-400" />
            <span>مربی هوشمند AI Coach</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'comments' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>دیدگاه‌ها</span>
            </div>
            {comments.filter(c => c.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {comments.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'users' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>کاربران سایت</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'products' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>دوره‌ها و محصولات</span>
          </button>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1 pt-3">
            تنظیمات و امنیت
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'settings' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>تنظیمات عمومی و تلگرام</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'appearance' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>ظاهر، رنگ و فونت</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'security' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>تغییر نام کاربری و رمز</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'audit' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>گزارش فعالیت‌ها (Audit Log)</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'backup' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>پشتیبان‌گیری (Backup JSON)</span>
          </button>
        </aside>

        {/* MAIN CONTENT VIEW AREA */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-amber-400" />
                  <span>داشبورد خلاصه آمار پلتفرم FIT MAX</span>
                </h2>
                <p className="text-xs text-slate-400">
                  اطلاعات لحظه‌ای کاربران، برنامه‌ها، بانک حرکات و دیدگاه‌های منتظر بررسی.
                </p>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold">کل کاربران ثبت‌شده</span>
                  <p className="text-2xl font-black text-amber-400">{dashboardStats?.totalUsers || registeredUsers.length}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold">برنامه‌های تمرینی فعال</span>
                  <p className="text-2xl font-black text-emerald-400">{dashboardStats?.activePrograms || 6}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold">حرکات کتابخانه</span>
                  <p className="text-2xl font-black text-sky-400">{exercisesList.length}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold">دیدگاه‌های معلق</span>
                  <p className="text-2xl font-black text-red-400">
                    {comments.filter(c => c.status === 'pending').length}
                  </p>
                </div>
              </div>

              {/* QUICK SHORTCUTS */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-black text-white">دسترسی سریع عملیاتی</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className="p-3.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>بررسی دیدگاه‌ها ({comments.filter(c => c.status === 'pending').length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('youtube')}
                    className="p-3.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-red-400 rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>افزودن ویدیوی یوتیوب</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('media')}
                    className="p-3.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>آپلود تصویر کاراکتر/حرکت</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="p-3.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>تنظیم تلگرام (@FitMax_Admin)</span>
                  </button>
                </div>
              </div>

              {/* RECENT ACTIVITY STREAM */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>آخرین فعالیت‌های مدیریتی انجام‌شده</span>
                </h3>

                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{log.action}</span> - <span className="text-amber-400">{log.target}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT CMS */}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>مدیریت محتوای عمومی و بنرهای هیرو (CMS)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  ویرایش متن‌های اصلی، بنرها و شعارهای متنی پلتفرم.
                </p>
              </div>

              {/* HERO BANNERS MANAGEMENT */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">بنرهای اصلی صفحه نخست (Hero Banners)</h3>
                  <button
                    onClick={() => {
                      const newBan = {
                        id: `ban_${Date.now()}`,
                        title_fa: 'بنر جدید فیت مکس',
                        description_fa: 'توضیحات اختصاصی بنر آموزشی',
                        image_url: '/images/character/fitmax_mascot.jpg',
                        button_text: 'مشاهده',
                        button_link: 'workout',
                        is_active: true,
                        display_order: heroBanners.length + 1
                      };
                      setHeroBanners([...heroBanners, newBan]);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن بنر جدید</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {heroBanners.map((ban, idx) => (
                    <div key={ban.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={ban.title_fa}
                          onChange={(e) => {
                            const updated = [...heroBanners];
                            updated[idx].title_fa = e.target.value;
                            setHeroBanners(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          placeholder="عنوان بنر"
                        />
                        <input
                          type="text"
                          value={ban.button_text}
                          onChange={(e) => {
                            const updated = [...heroBanners];
                            updated[idx].button_text = e.target.value;
                            setHeroBanners(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          placeholder="متن دکمه"
                        />
                      </div>
                      <textarea
                        value={ban.description_fa}
                        onChange={(e) => {
                          const updated = [...heroBanners];
                          updated[idx].description_fa = e.target.value;
                          setHeroBanners(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white h-16"
                        placeholder="توضیحات بنر"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & FOLDERS */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-400" />
                    <span>مدیریت تصاویر و ساختار پوشه‌ها</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    تصاویر کاراکتر، حرکات، مقالات و محصولات در پوشه‌های مجزا دسته‌بندی شده‌اند.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingMedia(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-2xl text-xs transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت تصویر جدید</span>
                </button>
              </div>

              {/* MEDIA ADD FORM MODAL */}
              {isAddingMedia && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white">ثبت تصویر جدید در پوشه رسانه</h3>
                  <form onSubmit={handleAddMediaFile} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={mediaFilenameInput}
                        onChange={(e) => setMediaFilenameInput(e.target.value)}
                        placeholder="نام فایل (مثال: character_mascot.jpg)"
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <select
                        value={mediaFolderInput}
                        onChange={(e) => setMediaFolderInput(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="character">پوشه /images/character (کاراکتر فیت مکس)</option>
                        <option value="exercises">پوشه /images/exercises (تصاویر حرکات)</option>
                        <option value="workouts">پوشه /images/workouts (برنامه‌ها)</option>
                        <option value="nutrition">پوشه /images/nutrition (تغذیه)</option>
                        <option value="articles">پوشه /images/articles (مقالات)</option>
                        <option value="courses">پوشه /images/courses (دوره‌ها)</option>
                        <option value="thumbnails">پوشه /images/thumbnails (تامبنیل یوتیوب)</option>
                        <option value="site">پوشه /images/site (لوگو و هدر)</option>
                        <option value="other">سایر متفرقه</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      required
                      value={mediaUrlInput}
                      onChange={(e) => setMediaUrlInput(e.target.value)}
                      placeholder="لینک مستقیم تصویر یا Data URL Base64"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingMedia(false)}
                        className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        ذخیره تصویر
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MEDIA GALLERY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {mediaFiles.map((med) => (
                  <div key={med.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 relative group">
                    <img
                      src={med.url}
                      alt={med.alt_text}
                      className="w-full h-32 object-cover rounded-xl bg-slate-950"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white truncate">{med.filename}</p>
                      <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 inline-block">
                        /images/{med.folder}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PAGES MANAGER */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>مدیریت تک تک صفحات و بخش‌های سایت</span>
                </h2>
                <p className="text-xs text-slate-400">
                  تنظیم عناوین، توضیحات سئو و فعال/غیرفعال کردن بخش‌ها.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { slug: 'home', title: 'صفحه اصلی (Home)' },
                  { slug: 'workout', title: 'برنامه تمرینی اختصاصی' },
                  { slug: 'encyclopedia', title: 'بانک حرکات و آناتومی' },
                  { slug: 'education', title: 'مقالات و آموزش' },
                  { slug: 'aicoach', title: 'مربی هوشمند AI' },
                  { slug: 'nutrition', title: 'محاسبه کالری و تغذیه' }
                ].map((pg) => (
                  <div key={pg.slug} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <span className="text-xs font-black text-amber-400">{pg.title}</span>
                    <p className="text-[11px] text-slate-400">شناسه: {pg.slug}</p>
                    <button
                      onClick={() => showToast(`تنظیمات صفحه ${pg.title} بارگذاری شد.`)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-xl text-xs font-bold"
                    >
                      ویرایش اجزای صفحه
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: WORKOUT PROGRAMS */}
          {activeTab === 'workouts' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-amber-400" />
                  <span>مدیریت دیتابیس برنامه‌های تمرینی</span>
                </h2>
                <p className="text-xs text-slate-400">
                  برنامه‌های مبتدی، متوسط و پیشرفته کلیستنیکس و بدنسازی.
                </p>
              </div>

              <div className="space-y-4">
                {DEFAULT_WORKOUT_PROGRAMS.map((prog) => (
                  <div key={prog.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">{prog.title_fa}</h3>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                        سطح: {prog.level_fa}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{prog.description_fa}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                      <span>روز در هفته: {prog.days_per_week} روز</span>
                      <span>•</span>
                      <span>مکان: {prog.location_fa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: EXERCISES DATABASE */}
          {activeTab === 'exercises' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-amber-400" />
                    <span>کتابخانه جامع حرکات ورزشی ({exercisesList.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    جستجو، ویرایش، حذف و افزودن جدیدترین حرکات کلیستنیکس و آناتومی.
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="جستجوی حرکت با نام فارسی یا انگلیسی..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercisesList
                  .filter(e => e.title_fa.includes(exerciseSearch) || e.title_en.toLowerCase().includes(exerciseSearch.toLowerCase()))
                  .map((ex) => (
                    <div key={ex.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                      <img
                        src={ex.image_url}
                        alt={ex.title_fa}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-950 shrink-0"
                      />
                      <div className="space-y-1 flex-1">
                        <h4 className="font-bold text-white text-xs">{ex.title_fa}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">{ex.title_en}</p>
                        <span className="inline-block bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/20">
                          عضله اصلی: {ex.primary_muscle_fa}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 7: YOUTUBE MANAGER */}
          {activeTab === 'youtube' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <span>مدیریت ویدیوهای یوتیوب کانال Fit Max</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    افزودن لینک یوتیوب جهت استخراج خودکار Video ID و قرارگیری در بخش آموزش.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingVideo(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-2xl text-xs transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن ویدیوی جدید</span>
                </button>
              </div>

              {/* ADD VIDEO MODAL */}
              {isAddingVideo && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white">افزودن ویدیوی جدید یوتیوب</h3>
                  <form onSubmit={handleAddYouTubeVideo} className="space-y-3">
                    <input
                      type="text"
                      required
                      value={videoTitleInput}
                      onChange={(e) => setVideoTitleInput(e.target.value)}
                      placeholder="عنوان فارسی ویدیو..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />

                    <input
                      type="text"
                      required
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      placeholder="لینک ویدیو یا Video ID یوتیوب (مثال: https://youtu.be/eGo4IYlbE5g)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingVideo(false)}
                        className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        ثبت ویدیو
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* YOUTUBE LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {youtubeVideos.map((vid) => (
                  <div key={vid.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-950">
                      <iframe
                        src={`https://www.youtube.com/embed/${vid.youtube_id}`}
                        title={vid.title_fa}
                        className="w-full h-full border-0"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs truncate">{vid.title_fa}</h4>
                      <button
                        onClick={() => handleDeleteYouTubeVideo(vid.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: AI COACH KNOWLEDGE */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-sky-400" />
                  <span>مدیریت پایگاه دانش و دستورات مربی هوشمند AI Coach</span>
                </h2>
                <p className="text-xs text-slate-400">
                  تنظیم منابع علمی، پاسخ‌های اختصاصی فیت مکس و مرزهای ایمنی پزشکی.
                </p>
              </div>

              <div className="space-y-3">
                {aiKnowledge.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <h4 className="font-bold text-amber-400 text-xs">{item.title_fa}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.content_fa}</p>
                    <span className="text-[10px] text-slate-500">دسته‌بندی: {item.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: COMMENTS MANAGEMENT */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span>مدیریت و تایید دیدگاه‌های مقالات</span>
                </h2>
                <p className="text-xs text-slate-400">
                  بررسی، تایید، رد یا حذف کامنت‌های ارسالی توسط کاربران.
                </p>
              </div>

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{comment.user_name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        comment.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        comment.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {comment.status === 'approved' ? 'تایید شده' : comment.status === 'pending' ? 'منتظر بررسی' : 'رد شده'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl">{comment.content}</p>

                    <div className="flex items-center gap-2 pt-1">
                      {comment.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateCommentStatus(comment.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تایید و انتشار</span>
                        </button>
                      )}

                      {comment.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateCommentStatus(comment.id, 'rejected')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رد دیدگاه</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1 rounded-xl text-xs font-bold transition"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span>مدیریت کاربران ثبت‌نامی پلتفرم</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    مشاهده پروفایل، آمار، برنامه‌ها و تاریخچه تمرینی کاربران با خروجی امن Excel.
                  </p>
                </div>

                <a
                  href="/api/admin/users/export-excel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-md shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل اکسل کاربران (fitmax-users.xlsx)</span>
                </a>
              </div>

              <div className="space-y-3">
                {registeredUsers.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
                    هنوز کاربری ثبت‌نام نکرده است.
                  </div>
                ) : (
                  registeredUsers.map((usr: any) => (
                    <div key={usr.id} className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{usr.display_name || usr.name || usr.username}</span>
                          <span className="bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md text-[10px]">
                            @{usr.username || usr.phone}
                          </span>
                          {usr.role && usr.role !== 'user' && (
                            <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {usr.role}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 font-mono">
                          {usr.phone} {usr.email ? `• ${usr.email}` : ''} • عضویت: {usr.created_at ? new Date(usr.created_at).toLocaleDateString('fa-IR') : 'نامشخص'}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                          <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                            هدف: {usr.goal_fa || usr.goal || 'ثبت‌نشده'}
                          </span>
                          <span className="text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md">
                            سطح: {usr.fitness_level_fa || '—'}
                          </span>
                          <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                            جلسات ثبت‌شده: {usr.total_logged_workouts || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {usr.status || 'فعال'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 11: PRODUCTS & SPECIAL ITEMS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    <span>مدیریت محصولات، دوره‌ها و کتاب‌های الکترونیکی</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    قیمت‌گذاری به تومان، لینک خرید مستقیم تلگرام ({siteSettings.telegramAdminHandle}).
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-2xl text-xs transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن دوره / محصول جدید</span>
                </button>
              </div>

              {/* ADD PRODUCT MODAL */}
              {isAddingProduct && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white">افزودن دوره یا محصول جدید</h3>
                  <form onSubmit={handleAddProduct} className="space-y-3">
                    <input
                      type="text"
                      required
                      value={newProdTitle}
                      onChange={(e) => setNewProdTitle(e.target.value)}
                      placeholder="عنوان محصول یا دوره..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        placeholder="قیمت به تومان (۰ = رایگان)"
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="course">دوره ویدیویی جامع</option>
                        <option value="ebook">کتاب الکترونیکی PDF</option>
                        <option value="specialized_plan">برنامه تمرینی تخصصی VIP</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        ثبت محصول
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PRODUCTS LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{p.title_fa}</h4>
                      <span className="text-amber-400 font-bold text-xs">
                        {p.is_free ? 'رایگان' : `${p.price_toman.toLocaleString('fa-IR')} تومان`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.description_fa}</p>
                    <a
                      href={`https://t.me/${siteSettings.telegramAdminHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-xl text-xs font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>لینک سفارش تلگرام ({siteSettings.telegramAdminHandle})</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 12: GENERAL SETTINGS & TELEGRAM */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  <span>تنظیمات عمومی سایت و لینک آی‌دی پشتیبانی تلگرام</span>
                </h2>
                <p className="text-xs text-slate-400">
                  تنظیم نام برند، آیدی تلگرام پشتیبانی، شماره تماس و اطلاعات هدر/فوتر.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">نام سایت / برند</label>
                    <input
                      type="text"
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">آیدی تلگرام پشتیبانی پلتفرم (اجباری)</label>
                    <input
                      type="text"
                      value={siteSettings.telegramAdminHandle}
                      onChange={(e) => setSiteSettings({ ...siteSettings, telegramAdminHandle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-mono font-bold"
                      placeholder="@FitMax_Admin"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">لینک کانال یوتیوب Fit Max</label>
                    <input
                      type="text"
                      value={siteSettings.youtubeUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, youtubeUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">شماره تلفن تماس</label>
                    <input
                      type="text"
                      value={siteSettings.contactPhone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveSiteSettings}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-2xl text-xs transition flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره کلی تنظیمات عمومی</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: APPEARANCE & TYPOGRAPHY */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <span>تنظیمات ظاهر، پالت رنگ و فونت پلتفرم</span>
                </h2>
                <p className="text-xs text-slate-400">
                  سفارشی‌سازی رنگ سازمانی برند فیت مکس (پیش‌فرض: #f97316 و #ffead9).
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">رنگ سازمانی (Primary Color)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">رنگ پس‌زمینه (Background)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appearanceSettings.backgroundColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, backgroundColor: e.target.value })}
                        className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={appearanceSettings.backgroundColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, backgroundColor: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveSiteSettings}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-2xl text-xs transition flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>اعمال تغییرات ظاهر</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: SECURITY & CREDENTIALS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span>تغییر اطلاعات ورود و حساب مدیریت</span>
                </h2>
                <p className="text-xs text-slate-400">
                  جهت حفظ امنیت پلتفرم، می‌توانید نام کاربری و رمز عبور مدیریت را در هر زمان تغییر دهید.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-lg">
                <form onSubmit={handleChangeCredentials} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">رمز عبور فعلی مدیریت (جهت تایید هویت)</label>
                    <input
                      type="password"
                      required
                      value={currPassChange}
                      onChange={(e) => setCurrPassChange(e.target.value)}
                      placeholder="رمز فعلی..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">نام کاربری جدید مدیر</label>
                    <input
                      type="text"
                      required
                      value={newUserChange}
                      onChange={(e) => setNewUserChange(e.target.value)}
                      placeholder="نام کاربری جدید (مثال: fitmax_master)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">رمز عبور جدید</label>
                    <input
                      type="password"
                      required
                      value={newPassChange}
                      onChange={(e) => setNewPassChange(e.target.value)}
                      placeholder="رمز عبور جدید امن..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black py-3 rounded-2xl text-xs transition shadow-md"
                  >
                    ذخیره و بروزرسانی اطلاعات ورود
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 15: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span>گزارش کامل فعالیت‌های انجام‌شده (Audit Log)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  ثبت تمامی تغییرات، ورودها، حذف‌ها و افزودن‌ها با تاریخ دقیق.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="divide-y divide-slate-800/80">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800/40 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{log.action}</span>
                          <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[10px]">
                            {log.target}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{log.details}</p>
                      </div>
                      <div className="text-left font-mono text-[10px] text-slate-500">
                        <div>کاربر: {log.adminUser}</div>
                        <div>{new Date(log.timestamp).toLocaleString('fa-IR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 16: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-400" />
                  <span>پشتیبان‌گیری کامل داده‌های پلتفرم (Backup & Restore)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  دانلود خروجی کامل JSON دیتابیس یا بازگردانی فایل‌های پشتیبان.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  با کلیک روی دکمه زیر، فایل کاملی شامل تنظیمات سایت، دیدگاه‌ها، بانک حرکات، ویدیوها و گزارش‌ها به صورت فایل <span className="font-mono text-amber-400">fitmax_backup.json</span> دانلود می‌شود.
                </p>

                <button
                  onClick={handleExportBackup}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود بک‌آپ کامل داده‌ها (JSON)</span>
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
