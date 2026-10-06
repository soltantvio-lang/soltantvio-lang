import React from 'react';
import { Youtube, Send, ShieldCheck, HeartPulse } from 'lucide-react';
import { NavTab } from './Navbar';

interface FooterProps {
  setActiveTab: (tab: NavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer dir="rtl" className="bg-white border-t border-orange-100 pt-10 pb-6 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                FM
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-slate-900 leading-none">
                  FIT MAX <span className="text-orange-600 text-xs">| فیت مکس</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">پلتفرم تخصصی کلیستنیکس</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              پلتفرم علمی، آموزشی و تخصصی کلیستنیکس و بدنسازی با وزن بدن.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://youtube.com/@fitmaxofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-xl text-xs font-bold transition"
              >
                <Youtube className="w-4 h-4" />
                <span>کانال یوتیوب</span>
              </a>
              <a
                href="https://t.me/FitMaxOfficial1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 px-3 py-1.5 rounded-xl text-xs font-bold transition"
              >
                <Send className="w-4 h-4" />
                <span>تلگرام</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">بخش‌های اصلی</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('assessment')} className="hover:text-orange-600 transition font-medium">
                  ارزیابی هوشمند و برنامه رایگان
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('workout')} className="hover:text-orange-600 transition font-medium">
                  برنامه تمرینی اختصاصی
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('encyclopedia')} className="hover:text-orange-600 transition font-medium">
                  بانک جامع حرکات و آناتومی
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('aicoach')} className="hover:text-orange-600 transition font-medium">
                  مربی هوشمند AI Coach
                </button>
              </li>
            </ul>
          </div>

          {/* Educational Content */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">آموزش و چالش‌ها</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('education')} className="hover:text-orange-600 transition font-medium">
                  مقالات علمی و تکنیک‌ها
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('challenges')} className="hover:text-orange-600 transition font-medium">
                  چالش ۳۰ روز تا بارفیکس
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('lifestyle')} className="hover:text-orange-600 transition font-medium">
                  ریکاوری و سبک زندگی
                </button>
              </li>
              <li>
                <a href="https://t.me/FitMax_Admin" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition font-medium">
                  پشتیبانی تلگرام (@FitMax_Admin)
                </a>
              </li>
            </ul>
          </div>

          {/* Scientific Disclaimer */}
          <div className="space-y-2 bg-[#ffead9]/40 p-4 rounded-2xl border border-[#ffead9]">
            <div className="flex items-center gap-1.5 text-orange-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>ملاحظات سلامت و مسئولیت علمی</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              تمامی برنامه‌ها و محتواها بر اساس استانداردهای ACSM تدوین شده‌اند و جایگزین مشاوره تخصصی پزشکی نیستند.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex gap-4">
            <span>© ۲۰۲۶ فیت مکس - تمامی حقوق محفوظ است</span>
            <span className="text-slate-300">|</span>
            <a href="#" className="hover:text-orange-500">قوانین و مقررات</a>
            <a href="#" className="hover:text-orange-500">حریم خصوصی</a>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              سرور متصل است
            </span>
            <span className="text-slate-300">|</span>
            <span>نسخه ۱.۴.۰</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
