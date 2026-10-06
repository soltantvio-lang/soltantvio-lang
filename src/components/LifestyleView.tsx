import React from 'react';
import { HeartPulse, Moon, Droplets, ShieldCheck, Activity } from 'lucide-react';

export const LifestyleView: React.FC = () => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl space-y-3 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <HeartPulse className="w-4 h-4" />
          <span>پایه علمی بازسازی و ریکاوری بافت عضلانی</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">سبک زندگی، ریکاوری و بهینه‌سازی خواب</h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          هایپرتروفی عضلانی و افزایش قدرت در زمان استراحت اتفاق می‌افتد، نه در باشگاه! اصول علمی خواب، هیدراتاسیون و مدیریت استرس را یاد بگیرید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Sleep */}
        <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs space-y-3">
          <div className="flex items-center gap-3 text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <span>بهینه‌سازی کیفیت خواب (Sleep Optimization)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            هورمون رشد (GH) عمدتاً در فازهای عمیق خواب (Deep Sleep) ترشح می‌شود. برای حداکثر سنتز پروتئین:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5 pr-2">
            <li>حداقل ۷ تا ۹ ساعت خواب باکیفیت و منظم در شبانه روز</li>
            <li>قطع مصرف کافئین حداقل ۶ ساعت قبل از زمان خواب</li>
            <li>کاهش نور آبی صفحه گوشی و تلویزیون ۱ ساعت قبل از خواب</li>
            <li>تاریک و خنک نگه داشتن محیط اتاق خواب (حدود ۱۸-۲۰ درجه)</li>
          </ul>
        </div>

        {/* Card 2: Hydration */}
        <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs space-y-3">
          <div className="flex items-center gap-3 text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <span>هیدراتاسیون و الکترولیت‌ها</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            کاهش حتی ۲ درصدی آب بدن باعث کاهش قابل توجه قدرت انقباضی عضلات و افت عملکرد سیستم عصبی مرکزی می‌شود.
          </p>
          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5 pr-2">
            <li>مصرف ۳۰ تا ۴۰ میلی‌لیتر آب به ازای هر کیلوگرم وزن بدن</li>
            <li>تامین الکترولیت‌های سدیم و پتاسیم در طول تمرینات سنگین</li>
            <li>توجه به رنگ ادرار به عنوان شاخص اولیه هیدراتاسیون (باید شفاف یا لیمویی روشن باشد)</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
