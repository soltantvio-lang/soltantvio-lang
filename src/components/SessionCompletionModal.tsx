import React from 'react';
import { WorkoutDay } from '../types';
import { 
  CheckCircle2, 
  Flame, 
  Award, 
  Zap, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  HeartPulse
} from 'lucide-react';

interface SessionCompletionModalProps {
  day: WorkoutDay;
  weekNumber: number;
  completedDaysCount: number;
  totalDaysCount: number;
  weeklyProgressPercent: number;
  onClose: () => void;
  onViewWeekAnalysis?: () => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  day,
  weekNumber,
  completedDaysCount,
  totalDaysCount,
  weeklyProgressPercent,
  onClose,
  onViewWeekAnalysis
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 text-right">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-orange-100 animate-fadeIn text-center">
        
        {/* Animated Badge Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <span className="text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block">
            جلسه روز {day.day_number} ثبت شد
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            عالی بود! تمرین امروز با موفقیت تکمیل شد 🔥
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            اطلاعات ست‌ها و RPE شما در دیتابیس هوشمند Fit Max ذخیره شدند تا مربی در پایان هفته دقیق‌ترین تنظیمات اضافه بار را اعمال کند.
          </p>
        </div>

        {/* Key Session Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-bold text-[11px] block">پیشرفت هفته {weekNumber}</span>
            <span className="text-lg font-black text-slate-900 block">
              {completedDaysCount} از {totalDaysCount} جلسه
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              {weeklyProgressPercent}٪ از کل برنامه
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-bold text-[11px] block">وضعیت ثبت</span>
            <span className="text-lg font-black text-emerald-700 block">تایید رسمی</span>
            <span className="text-[10px] text-slate-500">بدون اختلال در ریتم</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            بازگشت به برنامه هفتگی
          </button>

          {onViewWeekAnalysis && (
            <button
              onClick={() => {
                onClose();
                onViewWeekAnalysis();
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              مشاهده کارنامه و تحلیل این هفته
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
