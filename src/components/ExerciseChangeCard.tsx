import React from 'react';
import { ExercisePerformanceMetric } from '../utils/adaptiveEngine';
import { 
  TrendingUp, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Dumbbell
} from 'lucide-react';

interface ExerciseChangeCardProps {
  metrics: ExercisePerformanceMetric[];
  adjustmentsList?: string[];
}

export const ExerciseChangeCard: React.FC<ExerciseChangeCardProps> = ({
  metrics,
  adjustmentsList = []
}) => {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'PROGRESS':
        return {
          label: '↑ اضافه بار (Progression)',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: ArrowUpRight
        };
      case 'KEEP':
        return {
          label: '→ تثبیت فرم (Consolidation)',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Check
        };
      case 'REPLACE':
        return {
          label: '🔄 جایگزینی هوشمند',
          color: 'bg-amber-100 text-amber-900 border-amber-200',
          icon: RotateCcw
        };
      case 'REGRESS':
        return {
          label: '⬇️ کاهش بار (Regression)',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: ArrowDownRight
        };
      default:
        return {
          label: 'پیشرفت عادی',
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: Sparkles
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-4 text-right">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900">
              تغییرات سطح حرکات در این هفته (Exercise-Level Adaptation)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              بررسی تک‌تک حرکات بر پایه RPE، تکمیل ست‌ها و عدم احساس درد
            </p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
          {metrics.length} حرکت پایش‌شده
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {metrics.slice(0, 6).map((metric, idx) => {
          const badge = getDecisionBadge(metric.adaptation_decision);
          const BadgeIcon = badge.icon;

          return (
            <div 
              key={idx}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2.5 hover:border-orange-300 transition"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 text-xs">
                  {metric.exercise_name_fa}
                </span>

                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${badge.color}`}>
                  <BadgeIcon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60">
                <span>برنامه‌ریزی: <strong>{metric.planned_sets} ست × {metric.planned_reps} تکرار</strong></span>
                <span>•</span>
                <span>RPE میانگین: <strong className="text-orange-600">{metric.avg_rpe.toFixed(1)}</strong></span>
              </div>

              {/* Reason */}
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {metric.adaptation_reason_fa}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
