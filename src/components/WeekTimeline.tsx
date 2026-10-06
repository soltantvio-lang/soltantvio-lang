import React from 'react';
import { WeeklyUnlockStatus } from '../utils/adaptiveEngine';
import { 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Calendar, 
  Flame, 
  Clock, 
  ChevronLeft,
  Zap,
  Brain
} from 'lucide-react';

interface WeekTimelineProps {
  selectedWeekNumber: number;
  currentWeekNumber: number;
  unlockStatuses: Record<number, WeeklyUnlockStatus>;
  onSelectWeek: (weekNumber: number) => void;
  onOpenAnalysisModal?: () => void;
  overrideUnlock?: boolean;
}

export const WeekTimeline: React.FC<WeekTimelineProps> = ({
  selectedWeekNumber,
  currentWeekNumber,
  unlockStatuses,
  onSelectWeek,
  onOpenAnalysisModal,
  overrideUnlock = false
}) => {
  const weeks = [1, 2, 3, 4];

  const weekPhaseTitles: Record<number, string> = {
    1: 'فاز پایه و تکنیک',
    2: 'اورلود تدریجی',
    3: 'شوک اکسنتریک',
    4: 'دیلود / اوج‌گیری'
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-900">مسیر ۴ هفته‌ای تمرینات تطبیقی (Train → Log → Adapt)</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              هر هفته بر اساس لاگ‌های واقعی و میانگین RPE هفته قبل بازتولید می‌شود
            </p>
          </div>
        </div>

        {onOpenAnalysisModal && (
          <button
            onClick={onOpenAnalysisModal}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-extrabold text-xs border border-orange-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-orange-600" />
            <span>کارنامه و تحلیل هوشمند</span>
          </button>
        )}
      </div>

      {/* 4-Step Timeline Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {weeks.map((wk) => {
          const isSelected = selectedWeekNumber === wk;
          const status = unlockStatuses[wk];
          const isUnlocked = overrideUnlock || (status?.is_unlocked ?? (wk === 1));
          const isCompleted = status?.is_completed ?? false;
          const isCurrent = currentWeekNumber === wk && !isCompleted;
          const completionRate = status?.completion_rate_percent || 0;

          // Status label and color
          let statusBadge = {
            text: 'قفل شده',
            classes: 'bg-slate-100 text-slate-500 border-slate-200',
            icon: Lock
          };

          if (isCompleted) {
            statusBadge = {
              text: 'تکمیل شد ✓',
              classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              icon: CheckCircle2
            };
          } else if (isSelected) {
            statusBadge = {
              text: isCurrent ? 'هفته جاری ⚡' : 'انتخاب شده',
              classes: 'bg-orange-600 text-white border-orange-600',
              icon: Zap
            };
          } else if (isUnlocked) {
            statusBadge = {
              text: 'آماده تمرین',
              classes: 'bg-amber-100 text-amber-900 border-amber-200',
              icon: Sparkles
            };
          }

          const BadgeIcon = statusBadge.icon;

          return (
            <div
              key={wk}
              onClick={() => {
                if (isUnlocked) {
                  onSelectWeek(wk);
                } else if (onOpenAnalysisModal) {
                  onOpenAnalysisModal();
                }
              }}
              className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none text-right ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-500/30'
                  : isUnlocked
                  ? 'bg-white hover:bg-orange-50/40 text-slate-800 border-slate-200 hover:border-orange-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200/80 hover:border-slate-300 opacity-80'
              }`}
            >
              {/* Top Row: Week Number + Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                  هفته {wk}
                </span>

                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${statusBadge.classes}`}>
                  <BadgeIcon className="w-3 h-3 shrink-0" />
                  <span>{statusBadge.text}</span>
                </span>
              </div>

              {/* Middle: Phase Title */}
              <div className="space-y-1 my-2">
                <span className={`text-xs font-black block ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {weekPhaseTitles[wk]}
                </span>
                <span className={`text-[10px] block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {wk === 1 ? 'تعیین خط مبنای توان' : `تطبیق بر پایه هفته ${wk - 1}`}
                </span>
              </div>

              {/* Bottom: Progress Bar / Lock Requirement */}
              <div className="pt-2 border-t border-slate-100/10 space-y-1">
                {isUnlocked ? (
                  <>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>پیشرفت:</span>
                      <span className={`font-black ${isSelected ? 'text-amber-300' : 'text-orange-600'}`}>
                        {completionRate}٪
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/40 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                    <span className="line-clamp-1">نیازمند تکمیل هفته {wk - 1}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
