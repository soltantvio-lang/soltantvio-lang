import React from 'react';
import { WeeklyPerformanceAnalysis, WeeklyUnlockStatus } from '../utils/adaptiveEngine';
import { 
  Brain, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Flame, 
  Sparkles,
  ArrowLeft,
  X,
  Lock,
  Unlock
} from 'lucide-react';

interface WeeklyAnalysisModalProps {
  analysis: WeeklyPerformanceAnalysis;
  onClose: () => void;
  onGenerateNextWeek: () => void;
  isNextWeekUnlocked?: boolean;
}

export const WeeklyAnalysisModal: React.FC<WeeklyAnalysisModalProps> = ({
  analysis,
  onClose,
  onGenerateNextWeek,
  isNextWeekUnlocked = true
}) => {
  const strategyColors = {
    Progression: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Consolidation: 'bg-blue-50 text-blue-800 border-blue-300',
    Maintenance: 'bg-amber-50 text-amber-800 border-amber-300',
    Deload: 'bg-purple-50 text-purple-800 border-purple-300',
    Regression: 'bg-rose-50 text-rose-800 border-rose-300'
  };

  const strategyLabels = {
    Progression: 'پیشرفت و اورلود تدریجی (Progressive Overload)',
    Consolidation: 'تثبیت بار و تسلط بیومکانیک (Consolidation)',
    Maintenance: 'حفظ حجم و اصلاح تکنیک (Maintenance)',
    Deload: 'دیلود و بازسازی بافت‌های پیوندی (Deload)',
    Regression: 'کاهش مقطعی بار و بازسازی توان پایه (Regression)'
  };

  const recoveryLabels = {
    optimal: { label: 'عالی و بهینه', color: 'text-emerald-700 bg-emerald-100' },
    moderate: { label: 'متوسط و قابل قبول', color: 'text-amber-700 bg-amber-100' },
    fatigued: { label: 'خستگی تجمیعی بالا', color: 'text-orange-700 bg-orange-100' },
    compromised: { label: 'نیازمند احتیاط / گزارش درد', color: 'text-rose-700 bg-rose-100' }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn border border-orange-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-md">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">
                  تحلیل عملکرد هفته {analysis.week_number}
                </span>
                <span className="text-[11px] font-bold text-slate-400">Adaptive AI Coach</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                گزارش عملکرد و تصمیم‌گیری هفته {analysis.week_number + 1}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Core KPIs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-center">
            <span className="text-slate-500 font-bold text-[11px]">جلسات تکمیل‌شده</span>
            <span className="text-lg font-black text-slate-900 block">
              {analysis.total_sessions_completed} از {analysis.total_sessions_scheduled}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
              analysis.is_week_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {Math.round(analysis.week_completion_rate * 100)}٪ تعهد به تمرین
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-center">
            <span className="text-slate-500 font-bold text-[11px]">میانگین RPE ثبت‌شده</span>
            <span className="text-lg font-black text-orange-600 block">
              {analysis.average_rpe.toFixed(1)} / ۱۰
            </span>
            <span className="text-[10px] text-slate-500">
              {analysis.average_rpe >= 8.5 ? 'فشار سنگین' : analysis.average_rpe >= 7 ? 'فشار بهینه' : 'فشار سبک'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-center">
            <span className="text-slate-500 font-bold text-[11px]">وضعیت ریکاوری</span>
            <span className="text-lg font-black text-slate-900 block">
              خستگی {analysis.average_fatigue}/۱۰
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
              recoveryLabels[analysis.recovery_status].color
            }`}>
              {recoveryLabels[analysis.recovery_status].label}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-center">
            <span className="text-slate-500 font-bold text-[11px]">امتیاز انطباق (Adherence)</span>
            <span className="text-lg font-black text-emerald-700 block">
              {analysis.adherence_score} / ۱۰۰
            </span>
            <span className="text-[10px] text-slate-500">کیفیت اجرای بلوک</span>
          </div>
        </div>

        {/* 2. Strategy Decision Banner */}
        <div className={`p-4 rounded-2xl border ${strategyColors[analysis.overall_strategy_decision]} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-orange-600" />
              تصمیم استراتژیک برای هفته {analysis.week_number + 1}:
            </span>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white/80 border border-current shadow-xs">
              {strategyLabels[analysis.overall_strategy_decision]}
            </span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {analysis.strategy_reason_fa}
          </p>
        </div>

        {/* 3. Strengths & Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Strengths */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 font-black text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>نقاط قوت و دستاوردها در هفته {analysis.week_number}:</span>
            </div>
            <ul className="space-y-1.5 text-emerald-800 text-[11px] pr-1">
              {analysis.strong_areas_fa.map((st, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>تمرکز و اصلاحات هفته {analysis.week_number + 1}:</span>
            </div>
            <ul className="space-y-1.5 text-amber-800 text-[11px] pr-1">
              {analysis.weak_areas_fa.map((wk, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Exercise-Level Decisions Table */}
        {analysis.exercise_metrics.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-800 block">
              جزئیات انطباق به تفکیک حرکات تمرینی (Exercise-Level Adaptation):
            </span>
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-right text-[11px]">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-2.5">حرکت</th>
                    <th className="p-2.5 text-center">ست‌های تکمیل‌شده</th>
                    <th className="p-2.5 text-center">RPE میانگین</th>
                    <th className="p-2.5 text-center">تصمیم موتور</th>
                    <th className="p-2.5">علت تطبیق (Reasoning)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.exercise_metrics.map((m, idx) => {
                    const actionBadge = {
                      PROGRESS: 'bg-emerald-100 text-emerald-800',
                      KEEP: 'bg-slate-100 text-slate-800',
                      REGRESS: 'bg-amber-100 text-amber-800',
                      REPLACE: 'bg-rose-100 text-rose-800',
                      MODIFY: 'bg-purple-100 text-purple-800',
                      ADD: 'bg-blue-100 text-blue-800',
                      REMOVE: 'bg-slate-200 text-slate-600'
                    }[m.adaptation_decision] || 'bg-slate-100 text-slate-800';

                    const actionLabel = {
                      PROGRESS: 'ارتقا (Progress)',
                      KEEP: 'تثبیت (Maintain)',
                      REGRESS: 'کاهش بار (Regress)',
                      REPLACE: 'جایگزینی (Replace)',
                      MODIFY: 'تغییر پارامتر',
                      ADD: 'افزودن',
                      REMOVE: 'حذف'
                    }[m.adaptation_decision] || m.adaptation_decision;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-extrabold text-slate-900">{m.exercise_name_fa}</td>
                        <td className="p-2.5 text-center font-bold text-slate-700">
                          {m.completed_sets} از {m.planned_sets}
                        </td>
                        <td className="p-2.5 text-center font-bold text-orange-600">
                          {m.avg_rpe.toFixed(1)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${actionBadge}`}>
                            {actionLabel}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 text-[10px] leading-relaxed">
                          {m.adaptation_reason_fa}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>برنامه هفته {analysis.week_number + 1} با اعمال این تحلیل ساخته می‌شود.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
            >
              بستن گزارش
            </button>
            <button
              onClick={() => {
                onGenerateNextWeek();
                onClose();
              }}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>دریافت و ساخت برنامه هفته {analysis.week_number + 1}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
