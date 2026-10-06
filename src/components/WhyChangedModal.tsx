import React from 'react';
import { WeeklyPerformanceAnalysis } from '../utils/adaptiveEngine';
import { WorkoutProgram } from '../types';
import { 
  Brain, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  X, 
  ArrowRight,
  Flame,
  Clock,
  Dumbbell
} from 'lucide-react';

interface WhyChangedModalProps {
  analysis: WeeklyPerformanceAnalysis;
  activeProgramForWeek: WorkoutProgram | null;
  selectedWeekNumber: number;
  onClose: () => void;
}

export const WhyChangedModal: React.FC<WhyChangedModalProps> = ({
  analysis,
  activeProgramForWeek,
  selectedWeekNumber,
  onClose
}) => {
  const strategyDetails: Record<string, { label: string; color: string; desc: string }> = {
    Progression: {
      label: 'پیشرفت و اضافه بار تدریجی (Progressive Overload)',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'با توجه به ثبت RPE بهینه و عدم خستگی مفرط، اضافه بار تدریجی از طریق افزایش تکرارها، افزایش بار وزنه و ارتقای متغیرهای تمرین اعمال شد.'
    },
    Consolidation: {
      label: 'تثبیت بار و تسلط بیومکانیک (Consolidation)',
      color: 'bg-blue-50 text-blue-800 border-blue-300',
      desc: 'ست‌ها با فشار نسبتاً بالا تکمیل شدند؛ برای جلوگیری از بیش‌تمرینی و تعمیق الگوی عصبی، بار فعلی حفظ و تثبیت گردید.'
    },
    Maintenance: {
      label: 'حفظ حجم و پیشگیری از آسیب (Maintenance)',
      color: 'bg-amber-50 text-amber-800 border-amber-300',
      desc: 'تمرکز روی اصلاح اجرای تکنیک و پایش مفاصل؛ حجم تمرین بدون فشار مضاعف حفظ شده است.'
    },
    Deload: {
      label: 'دیلود هوشمند و سوپرکامپنسیشن (Deload)',
      color: 'bg-purple-50 text-purple-800 border-purple-300',
      desc: 'جهت کاهش خستگی تجمیعی سیستم عصبی مرکزی و بازسازی مفاصل، ۳۰٪ از حجم ست‌ها کاسته شد تا جهش قدرتی در دوره بعد رخ دهد.'
    },
    Regression: {
      label: 'کاهش مقطعی بار و بازسازی (Regression)',
      color: 'bg-rose-50 text-rose-800 border-rose-300',
      desc: 'کاهش مقطعی شدت برای خروج از مرز ناتوانی و پیشگیری از بروز صدمات تاندونی.'
    }
  };

  const currentStrategy = strategyDetails[analysis.overall_strategy_decision] || strategyDetails.Progression;

  // Retrieve adjustments list from activeProgramForWeek or weekly_review
  const review = activeProgramForWeek?.weekly_review;
  const adjustments = review?.adjustments_made_fa || [];
  const keyFindings = review?.key_findings_fa || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn border border-orange-100 text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-md">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">
                  هوش مصنوعی مربی Fit Max
                </span>
                <span className="text-[11px] font-bold text-slate-400">تحلیل چرخه تطبیقی</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                چرا برنامه هفته {selectedWeekNumber} تغییر کرد؟
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Previous Week Performance Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span>خلاصه عملکرد ثبت‌شده در هفته {selectedWeekNumber - 1}:</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold block">پایبندی به جلسات</span>
              <span className="text-base font-black text-slate-900">{analysis.adherence_score}٪</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold block">میانگین RPE</span>
              <span className="text-base font-black text-orange-600">{analysis.average_rpe.toFixed(1)} / ۱۰</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold block">خستگی تجمیعی</span>
              <span className="text-base font-black text-slate-900">{analysis.average_fatigue} / ۱۰</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold block">گزارش درد</span>
              <span className={`text-xs font-black ${analysis.has_pain_flag ? 'text-rose-600' : 'text-emerald-700'}`}>
                {analysis.has_pain_flag ? 'ثبت درد مفصلی' : 'بدون درد'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Coach Decision & Logic */}
        <div className="p-4 rounded-2xl border space-y-2.5 text-xs bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="font-extrabold text-slate-900">تصمیم موتور هوشمند:</span>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full border ${currentStrategy.color}`}>
              {currentStrategy.label}
            </span>
          </div>

          <p className="text-slate-700 leading-relaxed text-xs">
            {analysis.strategy_reason_fa || currentStrategy.desc}
          </p>

          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">دلایل علمی این تصمیم:</span>
            <ul className="space-y-1 text-[11px] text-slate-700">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>اجرای کامل اکثر ست‌ها و سازگاری با الگوی بارگذاری هفته قبل</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>ثبت شاخص RPE در محدوده بهینه و ظرفیت برای اضافه بار تدریجی</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>حفظ بودجه زمانی دقیق جلسه بدون افزایش فرسایشی طول تمرین</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Adjustments List */}
        {adjustments.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>تغییرات اختصاصی اعمال‌شده در برنامه این هفته:</span>
            </h3>

            <div className="space-y-2">
              {adjustments.map((adj, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-orange-50/70 p-3 rounded-xl border border-orange-200/80 text-xs">
                  <span className="text-orange-600 font-black text-xs shrink-0 mt-0.5">⚡</span>
                  <span className="text-slate-800 font-bold leading-relaxed">{adj}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            متوجه شدم — رفتن به تمرینات هفته {selectedWeekNumber}
          </button>
        </div>
      </div>
    </div>
  );
};
