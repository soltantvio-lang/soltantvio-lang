import React from 'react';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Brain, 
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';

interface WeekCompletionModalProps {
  completedWeekNumber: number;
  nextWeekNumber: number;
  onClose: () => void;
  onAnalyzeAndGenerateNextWeek: () => void;
}

export const WeekCompletionModal: React.FC<WeekCompletionModalProps> = ({
  completedWeekNumber,
  nextWeekNumber,
  onClose,
  onAnalyzeAndGenerateNextWeek
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 text-right">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-orange-100 animate-fadeIn text-center">
        
        {/* Trophy Glow Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white mx-auto flex items-center justify-center shadow-xl shadow-orange-500/30">
          <Trophy className="w-10 h-10" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full inline-block border border-emerald-200">
            هفته {completedWeekNumber} با موفقیت ۱۰۰٪ کامل شد 🎉
          </span>
          <h2 className="text-2xl font-black text-slate-900 leading-snug">
            تبریک! تمام جلسات هفته {completedWeekNumber} رو انجام دادی
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            حالا نوبت هوش مصنوعی مربی Fit Max است که لاگ‌ها، میانگین RPE و ریکاوری شما را ممیزی کند تا برنامه اختصاصی هفته {nextWeekNumber} را بر اساس عملکرد واقعی‌تان بسازد.
          </p>
        </div>

        {/* Audit Checklist Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-right text-xs">
          <span className="text-[11px] font-black text-slate-700 block">
            معیارهای در حال تحلیل توسط موتور مربی:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-800">
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>پایبندی ۱۰۰٪ به جلسات</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>میانگین فشار (RPE)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>پایش خستگی و مفاصل</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>نرخ اضافه بار تدریجی</span>
            </div>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              onAnalyzeAndGenerateNextWeek();
            }}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>تحلیل عملکرد و ساخت هوشمند برنامه هفته {nextWeekNumber} 🔥</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            مشاهده مجدد هفته فعلی
          </button>
        </div>
      </div>
    </div>
  );
};
