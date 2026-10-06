import React from 'react';
import { WorkoutProgram, WorkoutDay } from '../types';
import { 
  Sparkles, 
  Flame, 
  Clock, 
  Calendar, 
  Award, 
  Play, 
  CheckCircle2, 
  Zap,
  Dumbbell
} from 'lucide-react';

interface CurrentWeekHeroProps {
  program: WorkoutProgram;
  selectedWeekNumber: number;
  currentWeekNumber: number;
  totalWorkoutDays: number;
  completedWorkoutDays: number;
  weeklyProgressPercent: number;
  activeProgramForWeek: WorkoutProgram | null;
  selectedDayNumber: number;
  onStartNextSession: () => void;
  nextPendingDayNumber?: number;
}

export const CurrentWeekHero: React.FC<CurrentWeekHeroProps> = ({
  program,
  selectedWeekNumber,
  currentWeekNumber,
  totalWorkoutDays,
  completedWorkoutDays,
  weeklyProgressPercent,
  activeProgramForWeek,
  onStartNextSession,
  nextPendingDayNumber
}) => {
  // Determine coach greeting based on selected week and strategy
  const getCoachGreeting = () => {
    if (selectedWeekNumber === 1) {
      if (weeklyProgressPercent === 100) {
        return {
          headline: 'هفته اولت رو با قدرت تمام کردی! 🎉',
          subtext: 'پایه‌های قدرت و تکنیک شکل گرفتند. آماده تحلیل عملکرد و ورود به هفته دوم هستی.'
        };
      }
      return {
        headline: 'هفته اول — ساختن پایه‌های قدرت و تکنیک 💪',
        subtext: 'این هفته تمرکز روی یادگیری الگوی حرکتی و سنجش ظرفیت پایه است. جلسات رو منظم ثبت کن.'
      };
    }

    if (selectedWeekNumber === 2) {
      if (weeklyProgressPercent === 100) {
        return {
          headline: 'هفته دوم هم با موفقیت فتح شد! 🚀',
          subtext: 'اورلود تدریجی اعمال شد و بدنت وارد فاز تطبیق عمیق‌تر شده است.'
        };
      }
      return {
        headline: 'هفته دوم — وقت پیشرفته‌تر شدنه 🔥',
        subtext: 'برنامه این هفته با اضافه بار تدریجی (Progressive Overload) و بر اساس RPE هفته اول شخصی‌سازی شده.'
      };
    }

    if (selectedWeekNumber === 3) {
      return {
        headline: 'هفته سوم — شوک اکسنتریک و افزایش چگالی ⚡',
        subtext: 'تمپوهای کنترلی ۳-۱-۱-۰ و تنوع هدفمند در حرکات کمکی برای تحریک حداکثری هایپرتروفی.'
      };
    }

    // Week 4
    const strategy = activeProgramForWeek?.weekly_review?.adaptation_strategy;
    if (strategy === 'Deload') {
      return {
        headline: 'هفته چهارم — ریکاوری هوشمند و سوپرکامپنسیشن 🧘',
        subtext: 'کاهش کنترل‌شده حجم تمرین جهت بازسازی سیستم عصبی، بافت‌های پیوندی و جهش رشدی.'
      };
    }
    return {
      headline: 'هفته چهارم — آماده رکورد جدیدی؟ 🔥',
      subtext: 'فاز اوج‌گیری عملکرد و تثبیت دستاوردهای دوره ۴ هفته‌ای Fit Max.'
    };
  };

  const greeting = getCoachGreeting();
  const weekTheme = activeProgramForWeek?.week_focus_title_fa || program.week_focus_title_fa || program.phase_name_fa;
  const sessionBudget = activeProgramForWeek?.session_duration_budget_mins || program.session_duration_budget_mins || 60;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 md:p-8 border border-slate-700/80 shadow-xl space-y-6">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Top Meta Badges Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>هفته {selectedWeekNumber} از ۴</span>
          </span>

          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{weekTheme}</span>
          </span>

          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>بودجه جلسه: {sessionBudget} دقیقه</span>
          </span>
        </div>

        {selectedWeekNumber > 1 && (
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>برنامه تطبیقی بر اساس عملکرد هفته قبل</span>
          </span>
        )}
      </div>

      {/* Coach Greeting & Subtext */}
      <div className="relative z-10 space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
          {greeting.headline}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
          {greeting.subtext}
        </p>
      </div>

      {/* Weekly Progress Bar & Action CTA */}
      <div className="relative z-10 pt-2 border-t border-slate-700/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="font-extrabold text-slate-200">وضعیت هفتگی:</span>
            <span className="font-black text-orange-400">
              {completedWorkoutDays} از {totalWorkoutDays} جلسه انجام شده
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">درصد تکمیل هفته:</span>
            <span className="font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full text-xs border border-amber-500/30">
              {weeklyProgressPercent}٪
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-900/80 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700 shadow-inner">
          <div 
            className="bg-gradient-to-l from-orange-500 via-amber-500 to-yellow-400 h-full rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${weeklyProgressPercent}%` }}
          />
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {weeklyProgressPercent === 100 ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تمام جلسات این هفته کامل شد! آماده رفتن به مرحله بعدی.</span>
              </span>
            ) : nextPendingDayNumber ? (
              <span className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-orange-400" />
                <span>جلسه بعدی شما: <strong>روز {nextPendingDayNumber}</strong></span>
              </span>
            ) : (
              <span>جلسات باقیمانده را طبق برنامه تکمیل کنید</span>
            )}
          </div>

          {weeklyProgressPercent < 100 && (
            <button
              onClick={onStartNextSession}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {completedWorkoutDays === 0 ? 'شروع اولین جلسه این هفته' : 'ادامه تمرینات امروز'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
