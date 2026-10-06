import React from 'react';
import { WorkoutDay, PrescribedExercise, Exercise } from '../types';
import { EXERCISES_DATABASE } from '../data/exercises';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Dumbbell, 
  Info, 
  RotateCcw, 
  Sparkles, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Activity, 
  HeartPulse,
  Plus
} from 'lucide-react';

interface WorkoutSessionCardProps {
  day: WorkoutDay;
  weekNumber: number;
  isCompleted: boolean;
  onStartLogging: () => void;
  onViewExerciseDetail: (exercise: Exercise) => void;
  onRequestReplaceExercise?: (exercise: Exercise) => void;
  onRequestAddExercise?: () => void;
}

export const WorkoutSessionCard: React.FC<WorkoutSessionCardProps> = ({
  day,
  weekNumber,
  isCompleted,
  onStartLogging,
  onViewExerciseDetail,
  onRequestReplaceExercise,
  onRequestAddExercise
}) => {
  const getExerciseObj = (id: string): Exercise => {
    return EXERCISES_DATABASE.find(e => e.id === id) || EXERCISES_DATABASE[0];
  };

  const totalExercisesCount = day.main_workout.length + day.accessory.length + (day.finisher ? day.finisher.length : 0);

  if (day.is_rest_day) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4 text-right">
        <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100">
          <Moon className="w-8 h-8 text-sky-500" />
        </div>
        <div className="space-y-1 text-center">
          <span className="text-xs font-black text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 inline-block">
            روز ریکاوری فعال و ترمیم بافت‌ها
          </span>
          <h3 className="text-xl font-black text-slate-900">{day.title_fa}</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            {day.focus_fa || 'امروز عضله‌سازی در حالت استراحت رخ می‌دهد. تغذیه پروتئینی مناسب، آب کافی و حداقل ۸ ساعت خواب شبانه را اولویت قرار دهید.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-200/80 shadow-xs space-y-6 text-right">
      
      {/* Session Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black bg-slate-900 text-amber-400 px-3 py-1 rounded-full">
              روز {day.day_number} (هفته {weekNumber})
            </span>
            <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
              isCompleted 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                : 'bg-orange-100 text-orange-800 border-orange-200'
            }`}>
              {isCompleted ? '✓ انجام شد (ثبت رسمی)' : '○ آماده شروع تمرین'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">{day.title_fa}</h2>
          <p className="text-xs text-slate-500 font-medium">{day.focus_fa}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onRequestAddExercise && (
            <button
              onClick={onRequestAddExercise}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              title="افزودن حرکت اختیاری سازگار با تجهیزات و زمان جلسه"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span>افزودن حرکت</span>
            </button>
          )}

          <button
            onClick={onStartLogging}
            className={`px-6 py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 ${
              isCompleted 
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
            }`}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isCompleted ? 'ویرایش یا ثبت مجدد ست‌ها' : 'شروع ثبت ست‌به‌ست تمرین'}</span>
          </button>
        </div>
      </div>

      {/* Meta Specs Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-0.5">
          <span className="text-slate-400 font-bold text-[10px] block">مدت برآورد جلسه:</span>
          <span className="font-black text-slate-900 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>{day.estimated_duration_mins || day.time_budget_breakdown?.total_estimated_mins || 45} دقیقه</span>
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-0.5">
          <span className="text-slate-400 font-bold text-[10px] block">تعداد کل حرکات:</span>
          <span className="font-black text-slate-900 flex items-center gap-1">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalExercisesCount} حرکت تخصصی</span>
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-0.5">
          <span className="text-slate-400 font-bold text-[10px] block">تفکیک حرکات:</span>
          <span className="font-black text-slate-900">
            {day.main_workout.length} اصلی + {day.accessory.length} کمکی
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-0.5">
          <span className="text-slate-400 font-bold text-[10px] block">سطح شدت RPE:</span>
          <span className="font-black text-orange-600 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>{day.intensity_level === 'challenging' ? 'سنگین (RPE 8.5)' : 'بهینه (RPE 7-8)'}</span>
          </span>
        </div>
      </div>

      {/* 1. Warmup Section */}
      {day.warmup && day.warmup.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>گرم‌کردن و موبیلیتی مفاصل (Warm-up & Mobility):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {day.warmup.map((pe, idx) => {
              const ex = getExerciseObj(pe.exercise_id);
              return (
                <div 
                  key={idx}
                  className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-amber-950 block">{ex.name_fa}</span>
                    <span className="text-[11px] text-amber-800 font-medium">
                      {pe.sets} ست × {pe.target_reps} تکرار
                    </span>
                  </div>
                  <button
                    onClick={() => onViewExerciseDetail(ex)}
                    className="text-amber-800 hover:text-amber-950 text-[11px] font-bold underline cursor-pointer"
                  >
                    مشاهده فرم
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Main Workout Exercises */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            <span>حرکات اصلی و چندمفصلی (Main Exercises):</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">تمرکز بر اضافه بار تدریجی</span>
        </div>

        <div className="space-y-3">
          {day.main_workout.map((pe, idx) => {
            const ex = getExerciseObj(pe.exercise_id);

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3 hover:border-orange-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{ex.name_fa}</h4>
                      <span className="text-[10px] text-slate-500">{ex.primary_muscles?.join('، ') || ex.category} | الگوی: {pe.role || 'حرکت اصلی'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onRequestReplaceExercise && (
                      <button
                        onClick={() => onRequestReplaceExercise(ex)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                        title="تعویض هوشمند حرکت با معادل هم‌تراز"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>جایگزینی</span>
                      </button>
                    )}

                    <button
                      onClick={() => onViewExerciseDetail(ex)}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-800 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Info className="w-3 h-3 text-orange-600" />
                      <span>آموزش و ویدیو</span>
                    </button>
                  </div>
                </div>

                {/* Specs Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">ست و تکرار:</span>
                    <span className="font-black text-slate-900">{pe.sets} ست × {pe.target_reps}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">تمپو (سرعت):</span>
                    <span className="font-black font-mono text-slate-900">{pe.tempo || '2-0-1-0'}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">استراحت:</span>
                    <span className="font-black text-slate-900">{pe.rest_seconds} ثانیه</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">هدف RPE:</span>
                    <span className="font-black text-orange-600">RPE 7.5 - 8.5</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Accessory Exercises */}
      {day.accessory && day.accessory.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>حرکات کمکی و هایپرتروفی موضعی (Accessory Exercises):</span>
            </div>

            {onRequestAddExercise && (
              <button
                onClick={onRequestAddExercise}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن حرکت کمکی</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {day.accessory.map((pe, idx) => {
              const ex = getExerciseObj(pe.exercise_id);
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900">{ex.name_fa}</h4>
                    <div className="flex items-center gap-2">
                      {onRequestReplaceExercise && (
                        <button
                          onClick={() => onRequestReplaceExercise(ex)}
                          className="text-slate-500 hover:text-slate-700 text-[11px] font-bold cursor-pointer"
                          title="تعویض حرکت"
                        >
                          تعویض
                        </button>
                      )}
                      <button
                        onClick={() => onViewExerciseDetail(ex)}
                        className="text-orange-600 hover:text-orange-700 text-[11px] font-bold underline cursor-pointer"
                      >
                        جزئیات
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                    <span>{pe.sets} ست × {pe.target_reps} تکرار</span>
                    <span>استراحت: {pe.rest_seconds}ث</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Finisher / Core */}
      {day.finisher && day.finisher.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-black text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>بخش تکمیلی / کور / فینیشر (Core & Finisher):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {day.finisher.map((pe, idx) => {
              const ex = getExerciseObj(pe.exercise_id);
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs flex items-center justify-between"
                >
                  <span className="font-black text-rose-950">{ex.name_fa}</span>
                  <span className="text-[11px] text-rose-800 font-bold">{pe.sets} ست × {pe.target_reps}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Budget Breakdown Footer */}
      {day.time_budget_breakdown && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <Clock className="w-4 h-4" />
              <span>محاسبه دقیق بودجه زمانی: {day.time_budget_breakdown.total_estimated_mins} دقیقه</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
              Warmup + Execution + Rest + Transition ≤ Budget
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] pt-1">
            <div className="p-1.5 rounded-lg bg-slate-800/80">
              <span className="text-slate-400 block text-[10px]">گرم‌کردن:</span>
              <span className="font-black text-amber-400">{day.time_budget_breakdown.warmup_mins} دقیقه</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80">
              <span className="text-slate-400 block text-[10px]">اجرای ست‌ها:</span>
              <span className="font-black text-white">{day.time_budget_breakdown.main_workout_mins + day.time_budget_breakdown.accessory_mins} دقیقه</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80">
              <span className="text-slate-400 block text-[10px]">استراحت بین ست‌ها:</span>
              <span className="font-black text-white">{day.time_budget_breakdown.rest_mins} دقیقه</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80">
              <span className="text-slate-400 block text-[10px]">جابجایی تجهیزات:</span>
              <span className="font-black text-white">{day.time_budget_breakdown.transition_mins} دقیقه</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
