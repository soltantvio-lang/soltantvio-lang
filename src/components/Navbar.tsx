import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Brain, 
  Flame, 
  BookOpen, 
  Trophy, 
  User, 
  ShoppingCart, 
  ShieldCheck, 
  Menu, 
  X, 
  HeartPulse, 
  Calculator,
  Home,
  Sparkles,
  Download,
  Smartphone,
  CloudCheck,
  CloudOff,
  RefreshCw,
  LogIn,
  Layers
} from 'lucide-react';
import { authService, AuthUser } from '../services/authService';
import { syncService, SyncStatus } from '../services/syncService';
import { AuthModal } from './Auth/AuthModal';

export type NavTab = 
  | 'home'
  | 'assessment'
  | 'workout'
  | 'encyclopedia'
  | 'aicoach'
  | 'nutrition'
  | 'education'
  | 'challenges'
  | 'lifestyle'
  | 'profile'
  | 'cart'
  | 'admin';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  cartCount: number;
  userName?: string;
  hasAssessment: boolean;
  currentUser: AuthUser | null;
  onAuthChange: (user: AuthUser | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  userName,
  hasAssessment,
  currentUser,
  onAuthChange
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  useEffect(() => {
    const unsub = syncService.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  const mainTabs = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'assessment', label: 'ارزیابی هوشمند', icon: Sparkles, badge: 'رایگان' },
    { id: 'workout', label: 'برنامه تمرینی', icon: Dumbbell, highlight: hasAssessment },
    { id: 'encyclopedia', label: 'بانک حرکات', icon: BookOpen },
    { id: 'aicoach', label: 'مربی AI', icon: Brain, badge: 'هوشمند' },
    { id: 'nutrition', label: 'محاسبه‌گر کالری', icon: Calculator },
    { id: 'education', label: 'آموزش', icon: Flame },
    { id: 'challenges', label: 'چالش‌ها', icon: Trophy },
    { id: 'lifestyle', label: 'سبک زندگی', icon: HeartPulse },
  ];

  const handleTabClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header dir="rtl" className="sticky top-0 z-50 bg-white border-b border-orange-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => handleTabClick('home')}
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform">
                FM
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight leading-none">
                  FIT MAX
                </span>
                <span className="text-xs font-medium text-slate-400 leading-none mt-1">
                  پلتفرم تخصصی کلیستنیکس
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-5 mr-4">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as NavTab)}
                    className={`relative flex items-center gap-1.5 text-xs font-bold transition-all py-1.5 ${
                      isActive 
                        ? 'text-orange-600 border-b-2 border-orange-500' 
                        : 'text-slate-500 hover:text-orange-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Actions: Sync Status, Download APK, User Profile / Login, Cart, Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Cloud Sync Status Indicator */}
            <div 
              title={
                syncStatus === 'synced' ? 'همگام‌سازی ابری کامل است' :
                syncStatus === 'syncing' ? 'در حال همگام‌سازی اطلاعات با ابر...' :
                syncStatus === 'offline' ? 'حالت آفلاین فعال است' : 'تغییرات در انتظار اتصال'
              }
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 cursor-default"
            >
              {syncStatus === 'synced' && <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />}
              {syncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin" />}
              {syncStatus === 'offline' && <CloudOff className="w-3.5 h-3.5 text-slate-400" />}
              {syncStatus === 'pending' && <RefreshCw className="w-3.5 h-3.5 text-amber-500" />}
              <span className="hidden md:inline">
                {syncStatus === 'synced' ? 'همگام' :
                 syncStatus === 'syncing' ? 'در حال ذخیره' :
                 syncStatus === 'offline' ? 'آفلاین' : 'در صف ذخیره'}
              </span>
            </div>

            {/* Download APK Button */}
            <button
              type="button"
              onClick={() => setShowApkModal(true)}
              aria-label="دانلود اپلیکیشن اندروید APK"
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 border border-orange-400/30"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">دانلود نسخه اندروید</span>
              <span className="sm:hidden">APK</span>
            </button>

            {/* User Profile or Login Button */}
            {currentUser ? (
              <div 
                onClick={() => handleTabClick('profile')}
                className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-90 transition bg-orange-50/60 sm:bg-transparent px-2.5 py-1 rounded-xl sm:p-0"
              >
                <div className="hidden sm:flex flex-col text-left items-end">
                  <span className="text-xs font-bold text-slate-800">{currentUser.display_name || currentUser.username}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {hasAssessment ? 'برنامه ابری فعال' : 'ارزیابی نشده'}
                  </span>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ffead9] border-2 border-orange-200 flex items-center justify-center overflow-hidden text-orange-600 font-bold text-xs">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer active:scale-95 border border-slate-200"
              >
                <LogIn className="w-4 h-4 text-orange-600" />
                <span>ورود / ثبت‌نام</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => handleTabClick('cart')}
              aria-label={`سبد خرید${cartCount > 0 ? `، شامل ${cartCount} آیتم` : ''}`}
              className="relative min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 sm:p-2.5 bg-slate-50 hover:bg-orange-50 rounded-full text-slate-600 hover:text-orange-600 border border-slate-200 transition flex items-center justify-center cursor-pointer shadow-2xs"
              title="سبد خرید"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منوی ناوبری'}
              aria-expanded={mobileMenuOpen}
              className="xl:hidden min-w-[40px] min-h-[40px] p-2 rounded-xl text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          onAuthChange(user);
        }}
      />

      {/* APK Download & Installation Modal */}
      {showApkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">دانلود و نصب مستقیم اپلیکیشن فیت مکس</h3>
                  <p className="text-xs text-orange-100">نسخه اندروید ۱.۰.۰ (آفلاین + آنلاین)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApkModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
                <div className="font-bold text-orange-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-orange-600" />
                  <span>امکانات نسخه اندروید:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pr-1">
                  <li>همگام‌سازی ابری با همین حساب کاربری شما</li>
                  <li>اجرای آفلاین کامل بدون قطعی در باشگاه</li>
                  <li>تایمر هوشمند استراحت با ویبره (Haptic)</li>
                  <li>ثبت سریع ست‌ها با ۱ لمس</li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href="/fitmax.apk"
                  download="fitmax.apk"
                  className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer text-sm"
                >
                  <Download className="w-5 h-5" />
                  <span>دانلود مستقیم فایل FitMax.apk</span>
                </a>
              </div>

              <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1.5">
                <div className="font-bold text-slate-700">راهنمای نصب:</div>
                <p>• پس از اتمام دانلود فایل <b>fitmax.apk</b>، روی اعلان دانلود کلیک کرده و گزینه <b>Install</b> را بزنید.</p>
                <p>• با همان نام کاربری و رمز عبور خود در اپلیکیشن وارد شوید تا تمام برنامه‌ها بازیابی شوند.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1.5 animate-fadeIn">
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
            <button
              onClick={() => handleTabClick('admin')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold bg-purple-50 text-purple-700 mb-2 border border-purple-200"
            >
              <Layers className="w-5 h-5" />
              <span>پنل مدیریت فیت مکس</span>
            </button>
          )}

          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as NavTab)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'text-slate-700 hover:bg-orange-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
