import React from 'react';
import { WeeklyUnlockStatus } from '../utils/adaptiveEngine';
import { 
  Lock, 
  Brain, 
  Calendar, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface WeekLockedCardProps {
  selectedWeekNumber: number;
  currentActiveWeekNumber: number;
  unlockStatus?: WeeklyUnlockStatus;
  onReturnToActiveWeek: () => void;
  onOpenAnalysisModal?: () => void;
}

export const WeekLockedCard: React.FC<WeekLockedCardProps> = ({
  selectedWeekNumber,
  currentActiveWeekNumber,
  unlockStatus,
  onReturnToActiveWeek,
  onOpenAnalysisModal
}) => {
  const previousWeekNumber = selectedWeekNumber - 1;
  const currentCompletionRate = unlockStatus?.completion_rate_percent || 0;

  return (
    <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm text-center space-y-6 max-w-xl mx-auto my-6 text-right">
      {/* Padlock Icon */}
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center border border-slate-200 shadow-inner">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>

      {/* Main Text */}
      <div className="space-y-2 text-center">
        <span className="text-xs font-black text-orange-700 bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 inline-block">
          تمرین تطبیقی مرحله‌به‌مرحله (Sequential Training)
        </span>
        <h2 className="text-xl md:text-2xl font-black text-slate-900">
          🔒 برنامه هفته {selectedWeekNumber} در حال حاضر قفل است
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          سیستم Fit Max از ایجاد برنامه‌های کپی‌شده و صوری خودداری می‌کند. برنامه هفته {selectedWeekNumber} تنها پس از تکمیل جلسات واقعی هفته {previousWeekNumber} و تحلیل سطح توان و RPE شما به صورت اختصاصی متولد خواهد شد.
        </p>
      </div>

      {/* Unlock Requirement Box */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-2 text-right">
        <div className="flex items-center justify-between text-amber-900 font-black">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>شرط بازگشایی خودکار:</span>
          </span>
          <span>{currentCompletionRate}٪ / ۷۰٪</span>
        </div>
        <p className="text-[11px] text-amber-800 font-medium">
          {unlockStatus?.unlock_requirement_fa || `تکمیل حداقل ۷۰٪ جلسات تمرینی هفته ${previousWeekNumber}`}
        </p>
        <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-amber-600 h-full rounded-full transition-all duration-500" 
            style={{ width: `${Math.min(100, (currentCompletionRate / 70) * 100)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onReturnToActiveWeek}
          className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          بازگشت به هفته فعال (هفته {currentActiveWeekNumber})
        </button>

        {onOpenAnalysisModal && (
          <button
            onClick={onOpenAnalysisModal}
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Brain className="w-4 h-4 text-slate-500" />
            <span>مشاهده کارنامه عملکرد</span>
          </button>
        )}
      </div>
    </div>
  );
};
