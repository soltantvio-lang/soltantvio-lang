import React from 'react';
import { WeeklyPerformanceAnalysis } from '../utils/adaptiveEngine';
import { 
  TrendingUp, 
  Activity, 
  HeartPulse, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Flame, 
  Zap,
  Target,
  Brain
} from 'lucide-react';

interface WeeklyProgressCardProps {
  analysis: WeeklyPerformanceAnalysis;
  selectedWeekNumber: number;
  onOpenDetailedAnalysis?: () => void;
  onOpenWhyChanged?: () => void;
}

export const WeeklyProgressCard: React.FC<WeeklyProgressCardProps> = ({
  analysis,
  selectedWeekNumber,
  onOpenDetailedAnalysis,
  onOpenWhyChanged
}) => {
  const strategyDetails: Record<string, { label: string; bg: string; text: string; border: string; desc: string }> = {
    Progression: {
      label: 'پیشرفت و اضافه بار (Progression)',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      desc: 'افزایش تکرارها، بار وزنه یا پیچیدگی حرکات جهت تحریک مداوم هایپرتروفی.'
    },
    Consolidation: {
      label: 'تثبیت بار و تسلط بیومکانیک (Consolidation)',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      desc: 'حفظ بار و تکرارها جهت تسلط تکنیکی کامل و جلوگیری از جهش شتاب‌زده RPE.'
    },
    Maintenance: {
      label: 'حفظ حجم و اصلاح تکنیک (Maintenance)',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      desc: 'نگه‌داری فرم و حجم تمرینی بدون اضافه بار جهت سازگاری مفصلی.'
    },
    Deload: {
      label: 'دیلود و بازسازی (Deload)',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      desc: 'کاهش ۳۰٪ حجم تمرین جهت سوپرکامپنسیشن، کاهش خستگی عصبی و ریکاوری بافت‌ها.'
    },
    Regression: {
      label: 'کاهش مقطعی بار (Regression)',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      desc: 'کاهش بار برای بازگشت به محدوده ایمن و رفع آسیب یا خستگی مفرط.'
    }
  };

  const strategy = strategyDetails[analysis.overall_strategy_decision] || strategyDetails.Progression;

  const recoveryLabels = {
    optimal: { label: 'عالی و بهینه', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
    moderate: { label: 'متوسط و قابل قبول', color: 'text-amber-700 bg-amber-100 border-amber-200' },
    fatigued: { label: 'خستگی تجمیعی بالا', color: 'text-orange-700 bg-orange-100 border-orange-200' },
    compromised: { label: 'نیازمند احتیاط / درد', color: 'text-rose-700 bg-rose-100 border-rose-200' }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-orange-600 text-white rounded-2xl shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              شاخص‌های عملکرد و پایبندی هفته {selectedWeekNumber}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              داده‌های ثبت‌شده زنده برای مربیگری اختصاصی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenWhyChanged && selectedWeekNumber > 1 && (
            <button
              onClick={onOpenWhyChanged}
              className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-extrabold text-xs border border-orange-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-orange-600" />
              <span>چرا برنامه این هفته تغییر کرد؟</span>
            </button>
          )}

          {onOpenDetailedAnalysis && (
            <button
              onClick={onOpenDetailedAnalysis}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
            >
              جزئیات کامل
            </button>
          )}
        </div>
      </div>

      {/* 4 Core KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* 1. Sessions */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span className="text-slate-500 font-bold text-[11px] block">جلسات انجام‌شده</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">{analysis.total_sessions_completed}</span>
            <span className="text-xs text-slate-500 font-bold">از {analysis.total_sessions_scheduled} جلسه</span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
            analysis.is_week_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            پایبندی: {analysis.adherence_score}٪
          </span>
        </div>

        {/* 2. RPE */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span className="text-slate-500 font-bold text-[11px] block">میانگین فشار (RPE)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-orange-600">
              {analysis.average_rpe > 0 ? analysis.average_rpe.toFixed(1) : '-'}
            </span>
            <span className="text-xs text-slate-500 font-bold">از ۱۰</span>
          </div>
          <span className="text-[10px] text-slate-600 font-bold block">
            {analysis.average_rpe >= 8.5 ? 'فشار سنگین' : analysis.average_rpe >= 7 ? 'محدوده بهینه' : 'فشار ملایم'}
          </span>
        </div>

        {/* 3. Recovery */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span className="text-slate-500 font-bold text-[11px] block">وضعیت ریکاوری</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">{analysis.average_fatigue}</span>
            <span className="text-xs text-slate-500 font-bold">خستگی /۱۰</span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block border ${
            recoveryLabels[analysis.recovery_status].color
          }`}>
            {recoveryLabels[analysis.recovery_status].label}
          </span>
        </div>

        {/* 4. Pain / Safety */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span className="text-slate-500 font-bold text-[11px] block">پایش درد و مفاصل</span>
          <div className="flex items-center gap-1 mt-0.5">
            {analysis.has_pain_flag ? (
              <span className="text-rose-600 font-black text-xs flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>گزارش در {analysis.pain_locations.length} حرکت</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-black text-xs flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>بدون گزارش درد</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {analysis.has_pain_flag ? 'جایگزینی حرکات دردناک اعمال شد' : 'مفاصل در سلامت کامل'}
          </span>
        </div>
      </div>

      {/* Strategy Summary Banner */}
      <div className={`p-4 rounded-2xl border ${strategy.bg} ${strategy.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${strategy.text}`} />
            <span className={`font-black ${strategy.text}`}>
              تصمیم هوشمند مربی برای این هفته: {strategy.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {analysis.strategy_reason_fa || strategy.desc}
          </p>
        </div>

        <span className={`text-[11px] font-black px-3 py-1 rounded-full bg-white/80 border ${strategy.border} ${strategy.text} shrink-0 self-start sm:self-auto`}>
          استراتژی علمی
        </span>
      </div>
    </div>
  );
};
