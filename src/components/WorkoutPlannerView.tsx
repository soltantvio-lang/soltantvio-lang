import React, { useState } from 'react';
import { 
  WorkoutProgram, 
  WorkoutDay, 
  PrescribedExercise, 
  Exercise, 
  WorkoutLog, 
  UserAssessment
} from '../types';
import { EXERCISES_DATABASE } from '../data/exercises';
import { buildFull7DaySchedule } from '../utils/workoutEngine';
import { 
  analyzeWeeklyPerformance, 
  getWeeklyUnlockStatuses
} from '../utils/adaptiveEngine';
import { FitMaxMascot } from './FitMaxMascot';
import { WhyChangedModal } from './WhyChangedModal';
import { ExerciseChangeCard } from './ExerciseChangeCard';
import { WorkoutLoggingModal } from './WorkoutLoggingModal';
import { SessionCompletionModal } from './SessionCompletionModal';
import { WeekCompletionModal } from './WeekCompletionModal';
import { WeekLockedCard } from './WeekLockedCard';
import { WeeklyAnalysisModal } from './WeeklyAnalysisModal';
import { AddExerciseModal } from './AddExerciseModal';
import { 
  Dumbbell, 
  Play, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Zap, 
  Activity, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Info,
  RotateCcw,
  Check,
  Calendar,
  X
} from 'lucide-react';

interface WorkoutPlannerViewProps {
  program: WorkoutProgram | null;
  assessment?: UserAssessment | null;
  workoutLogs: WorkoutLog[];
  onLogWorkout: (log: WorkoutLog) => void;
  onReplaceExerciseInProgram?: (dayNumber: number, oldExerciseId: string, newExerciseId: string) => void;
  onAddExerciseToProgram?: (weekNumber: number, dayNumber: number, newPrescribed: PrescribedExercise) => void;
  onOpenAssessment: () => void;
  onAdaptProgramForNextWeek?: () => void;
  onGenerateAdaptiveWeek?: (targetWeekNumber: number) => void;
  onChangeDaysPerWeek?: (daysCount: number) => void;
}

export const WorkoutPlannerView: React.FC<WorkoutPlannerViewProps> = ({
  program,
  assessment,
  workoutLogs,
  onLogWorkout,
  onReplaceExerciseInProgram,
  onAddExerciseToProgram,
  onOpenAssessment,
  onAdaptProgramForNextWeek,
  onGenerateAdaptiveWeek,
  onChangeDaysPerWeek
}) => {
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(program?.current_week || 1);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [isLiveLoggingActive, setIsLiveLoggingActive] = useState<boolean>(false);
  const [activeExerciseForDetail, setActiveExerciseForDetail] = useState<Exercise | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [exerciseToReplace, setExerciseToReplace] = useState<{ dayNumber: number; exercise: Exercise } | null>(null);

  // Collapsible sections state (default closed to keep zero cognitive load)
  const [isSmartAnalysisOpen, setIsSmartAnalysisOpen] = useState<boolean>(false);
  const [isAdvancedDetailsOpen, setIsAdvancedDetailsOpen] = useState<boolean>(false);

  // Modals state
  const [showIdentityCardModal, setShowIdentityCardModal] = useState<boolean>(false);
  const [showGenerationReportModal, setShowGenerationReportModal] = useState<boolean>(false);
  const [showWeeklyAnalysisModal, setShowWeeklyAnalysisModal] = useState<boolean>(false);
  const [showWhyChangedModal, setShowWhyChangedModal] = useState<boolean>(false);
  const [showSessionCompletionModal, setShowSessionCompletionModal] = useState<boolean>(false);
  const [showWeekCompletionModal, setShowWeekCompletionModal] = useState<boolean>(false);
  const [overrideUnlock, setOverrideUnlock] = useState<boolean>(false);

  if (!program) {
    return (
      <div dir="rtl" className="max-w-xl mx-auto text-center space-y-6 py-12 px-4">
        <FitMaxMascot pose="thinking" size="lg" />
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">برنامه تمرینی هنوز فعال نشده است</h2>
          <p className="text-xs text-slate-600">
            برای دریافت برنامه اختصاصی متناسب با اهداف و شواهد علمی، ابتدا ارزیابی هوشمند را تکمیل کنید.
          </p>
        </div>
        <button
          onClick={onOpenAssessment}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-md transition cursor-pointer"
        >
          تکمیل ارزیابی و ساخت برنامه اختصاصی
        </button>
      </div>
    );
  }

  // Calculate unlock status for all 4 weeks
  const unlockStatuses = React.useMemo(() => {
    return getWeeklyUnlockStatuses(program, workoutLogs);
  }, [program, workoutLogs]);

  // Derive week-specific program representation (Strict week isolation)
  const activeProgramForWeek: WorkoutProgram | null = React.useMemo(() => {
    if (program?.weeks_map && program.weeks_map[selectedWeekNumber]) {
      return program.weeks_map[selectedWeekNumber];
    }
    if (selectedWeekNumber === 1) {
      return program;
    }
    return null;
  }, [program, selectedWeekNumber]);

  // Current weekly performance analysis for the active week
  const currentWeekAnalysis = React.useMemo(() => {
    return analyzeWeeklyPerformance(activeProgramForWeek || program, workoutLogs, selectedWeekNumber);
  }, [activeProgramForWeek, program, workoutLogs, selectedWeekNumber]);

  // Build a complete 7-day schedule for the selected week
  const days7 = React.useMemo(() => {
    if (!activeProgramForWeek) return [];
    return buildFull7DaySchedule(activeProgramForWeek.days, activeProgramForWeek.days_per_week);
  }, [activeProgramForWeek]);

  // Helper to check completed days strictly in the selected week
  const completedDayNumbers = React.useMemo(() => {
    return new Set(
      workoutLogs
        .filter(log => (!log.program_id || log.program_id === program.id) && (log.week_number || 1) === selectedWeekNumber)
        .map(log => log.day_number)
    );
  }, [workoutLogs, program.id, selectedWeekNumber]);

  // Total and completed workout days
  const totalWorkoutDaysCount = days7.filter(d => !d.is_rest_day).length;
  const completedWorkoutDaysCount = days7.filter(d => !d.is_rest_day && completedDayNumbers.has(d.day_number)).length;
  const weeklyProgressPercent = totalWorkoutDaysCount > 0 
    ? Math.round((completedWorkoutDaysCount / totalWorkoutDaysCount) * 100) 
    : 0;

  // Find the exact next pending workout session
  const nextPendingDay = days7.find(d => !d.is_rest_day && !completedDayNumbers.has(d.day_number));
  const activeSessionDay: WorkoutDay | undefined = days7.find(d => d.day_number === selectedDayNumber) || nextPendingDay || days7[0];

  // If user hasn't selected a day manually, default to the next pending day
  React.useEffect(() => {
    if (nextPendingDay && selectedDayNumber !== nextPendingDay.day_number && !completedDayNumbers.has(selectedDayNumber)) {
      // Keep focused on next actionable day
    }
  }, [selectedWeekNumber]);

  const handleSessionFinish = (newLog: WorkoutLog) => {
    onLogWorkout(newLog);
    setIsLiveLoggingActive(false);
    setShowSessionCompletionModal(true);

    const newCompletedCount = completedWorkoutDaysCount + (completedDayNumbers.has(newLog.day_number) ? 0 : 1);
    if (newCompletedCount >= totalWorkoutDaysCount && selectedWeekNumber < 4) {
      setTimeout(() => {
        setShowWeekCompletionModal(true);
      }, 700);
    }
  };

  const handleReplaceConfirm = (newExId: string) => {
    if (exerciseToReplace && onReplaceExerciseInProgram) {
      onReplaceExerciseInProgram(exerciseToReplace.dayNumber, exerciseToReplace.exercise.id, newExId);
      setExerciseToReplace(null);
    }
  };

  const getExerciseObj = (id: string): Exercise => {
    return EXERCISES_DATABASE.find(e => e.id === id) || EXERCISES_DATABASE[0];
  };

  const isCurrentWeekLocked = !overrideUnlock && unlockStatuses[selectedWeekNumber] && !unlockStatuses[selectedWeekNumber].is_unlocked;
  const isSelectedDayCompleted = selectedDayNumber ? completedDayNumbers.has(selectedDayNumber) : false;

  // Active workout status for the Hero Focus Card
  const heroSession = activeSessionDay || days7[0];
  const isHeroCompleted = heroSession ? completedDayNumbers.has(heroSession.day_number) : false;
  const heroExerciseCount = heroSession && !heroSession.is_rest_day 
    ? heroSession.main_workout.length + heroSession.accessory.length + (heroSession.finisher?.length || 0)
    : 0;
  const heroDuration = heroSession?.estimated_duration_mins || heroSession?.time_budget_breakdown?.total_estimated_mins || 35;

  return (
    <div dir="rtl" className="max-w-2xl mx-auto space-y-5 pb-20 px-3 sm:px-4 text-right select-none animate-fadeIn font-sans">
      
      {/* ========================================================================= */}
      {/* 1. HEADER (Simple & Clean - No start buttons) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-2 pb-1 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">برنامه تمرینی</h1>
          <p className="text-[11px] text-slate-500 font-medium">
            {program.phase_name_fa || 'دوره اختصاصی هایپرتروفی و قدرت'}
          </p>
        </div>

        {/* Minimal Week Timeline Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          {[1, 2, 3, 4].map((wk) => {
            const isSelected = selectedWeekNumber === wk;
            const isUnlocked = overrideUnlock || (unlockStatuses[wk]?.is_unlocked ?? (wk === 1));
            const isCompleted = unlockStatuses[wk]?.is_completed ?? false;

            return (
              <button
                key={wk}
                onClick={() => isUnlocked && setSelectedWeekNumber(wk)}
                disabled={!isUnlocked}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : isUnlocked
                    ? 'text-slate-700 hover:bg-slate-200'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
                title={!isUnlocked ? `هفته ${wk} بعد از تکمیل هفته قبلی باز می‌شود` : `هفته ${wk}`}
              >
                <span>هفته {wk}</span>
                {isCompleted ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : !isUnlocked ? (
                  <Lock className="w-2.5 h-2.5" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CURRENT WEEK SUMMARY CARD (Compact & Informative) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900">هفته {selectedWeekNumber} از ۴</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-bold">
              {completedWorkoutDaysCount} از {totalWorkoutDaysCount} جلسه انجام شده
            </span>
          </div>
          <span className="font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-[11px]">
            {weeklyProgressPercent}٪ تکمیل
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5">
          <div 
            className="bg-orange-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgressPercent}%` }}
          />
        </div>

        {/* Strategy note if exists */}
        {activeProgramForWeek?.week_focus_title_fa && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="font-medium">
              استراتژی این هفته: <strong className="font-bold text-slate-900">{activeProgramForWeek.week_focus_title_fa}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. LOCKED WEEK CARD (When selected week is locked) */}
      {/* ========================================================================= */}
      {isCurrentWeekLocked ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">🔒 هفته {selectedWeekNumber} قفل است</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              این هفته بعد از تکمیل جلسات هفته {selectedWeekNumber - 1} به صورت خودکار و انطباقی باز می‌شود.
            </p>
          </div>
          <button
            onClick={() => setSelectedWeekNumber(program.current_week || 1)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            بازگشت به هفته فعال (هفته {program.current_week || 1})
          </button>
        </div>
      ) : !activeProgramForWeek ? (
        /* Need generation card */
        <div className="bg-white rounded-2xl p-6 border border-orange-200 text-center space-y-4 shadow-2xs">
          <Sparkles className="w-8 h-8 text-orange-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">تولید برنامه هفته {selectedWeekNumber}</h3>
            <p className="text-xs text-slate-600">
              جلسات هفته قبل با موفقیت انجام شد. با یک کلیک برنامه این هفته را بر اساس خستگی و RPE ثبت‌شده بسازید.
            </p>
          </div>
          <button
            onClick={() => {
              if (onGenerateAdaptiveWeek) {
                onGenerateAdaptiveWeek(selectedWeekNumber);
              } else if (onAdaptProgramForNextWeek) {
                onAdaptProgramForNextWeek();
              }
            }}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            تولید هوشمند برنامه هفته {selectedWeekNumber}
          </button>
        </div>
      ) : (
        <>
          {/* ======================================================================= */}
          {/* 4. TODAY / NEXT WORKOUT CARD (The Sole Primary Action Focus of the Page) */}
          {/* ======================================================================= */}
          {heroSession && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl space-y-5">
              
              {/* Top Tag & Status */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black bg-orange-600 text-white px-3 py-1 rounded-full">
                  {heroSession.is_rest_day 
                    ? 'روز استراحت و ریکاوری' 
                    : isHeroCompleted 
                    ? 'جلسه انجام‌شده' 
                    : 'جلسه تمرینی بعدی'}
                </span>

                <span className="text-xs text-slate-300 font-medium">
                  روز {heroSession.day_number} از ۷
                </span>
              </div>

              {/* Title & Short Specs */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {heroSession.title_fa}
                </h2>
                
                {!heroSession.is_rest_day && (
                  <p className="text-xs text-slate-300 flex items-center gap-2 pt-1 font-medium">
                    <span className="text-orange-400 font-bold">{heroExerciseCount} حرکت</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>حدود {heroDuration} دقیقه</span>
                    </span>
                  </p>
                )}
              </div>

              {/* Compact Exercises Preview (Clean text list, non-intrusive) */}
              {!heroSession.is_rest_day && (
                <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">حرکات این جلسه:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {heroSession.main_workout.concat(heroSession.accessory).map((pe, idx) => {
                      const ex = getExerciseObj(pe.exercise_id);
                      return (
                        <span 
                          key={idx}
                          className="text-[11px] bg-slate-900/90 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-medium"
                        >
                          {ex.name_fa} ({pe.sets} ست)
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* THE SOLE PRIMARY CTA BUTTON OF THE PAGE */}
              <div>
                {heroSession.is_rest_day ? (
                  <div className="text-center py-2 text-xs text-slate-400">
                    امروز استراحت کنید تا بافت‌های عضلانی ترمیم و ریکاوری شوند.
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedDayNumber(heroSession.day_number);
                      setIsLiveLoggingActive(true);
                    }}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition transform active:scale-[0.99] cursor-pointer shadow-lg ${
                      isHeroCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-600/30'
                    }`}
                  >
                    {isHeroCompleted ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>مشاهده گزارش یا ویرایش ست‌ها</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-white" />
                        <span>شروع تمرین</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* 5. WEEKLY SESSION LIST (Simple, Compact, No Duplicate Big Start CTAs) */}
          {/* ======================================================================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-900">
                تمام جلسات این هفته (هفته {selectedWeekNumber}):
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                برای مشاهده و انتخاب کلیک کنید
              </span>
            </div>

            <div className="space-y-2">
              {days7.map((day) => {
                const isSelected = day.day_number === (activeSessionDay?.day_number || 1);
                const isCompleted = completedDayNumbers.has(day.day_number);
                const isRest = day.is_rest_day;
                const isCurrentPending = !isRest && !isCompleted && day.day_number === nextPendingDay?.day_number;
                const exCount = !isRest ? day.main_workout.length + day.accessory.length + (day.finisher?.length || 0) : 0;
                const duration = day.estimated_duration_mins || day.time_budget_breakdown?.total_estimated_mins || 35;

                return (
                  <div
                    key={day.day_number}
                    onClick={() => {
                      setSelectedDayNumber(day.day_number);
                    }}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-orange-500 shadow-xs ring-1 ring-orange-500/20'
                        : isCompleted
                        ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50'
                        : isRest
                        ? 'bg-slate-50 border-slate-200/60 opacity-80'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Left/Start: Day info */}
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrentPending
                          ? 'bg-orange-600 text-white'
                          : isRest
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isCompleted ? '✓' : day.day_number}
                      </span>

                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          {day.title_fa}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {isRest ? 'استراحت و ترمیم عضلات' : `${exCount} حرکت · حدود ${duration} دقیقه`}
                        </span>
                      </div>
                    </div>

                    {/* Right/End: Status badge only (No duplicate start CTA) */}
                    <div>
                      {isCompleted ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>تکمیل شد</span>
                        </span>
                      ) : isCurrentPending ? (
                        <span className="text-[11px] font-black text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                          🟢 تمرین بعدی
                        </span>
                      ) : isRest ? (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          استراحت
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                          ⚪ انجام نشده
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================================= */}
          {/* 6. SECONDARY ACTION: ADD EXERCISE (Non-intrusive, Clean) */}
          {/* ======================================================================= */}
          {heroSession && !heroSession.is_rest_day && (
            <div className="pt-1 flex items-center justify-between">
              <button
                onClick={() => setShowAddExerciseModal(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-orange-400 bg-slate-50 hover:bg-orange-50/40 text-slate-700 hover:text-orange-900 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-600" />
                <span>افزودن حرکت اختیاری به این جلسه (+ Add Exercise)</span>
              </button>
            </div>
          )}

          {/* ======================================================================= */}
          {/* 7. COLLAPSIBLE: SMART ANALYSIS & COACH RATIONALE (Zero default clutter) */}
          {/* ======================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsSmartAnalysisOpen(!isSmartAnalysisOpen)}
              className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/80 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-xl">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    تحلیل هوشمند و منطق تغییرات هفته {selectedWeekNumber}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    دلایل انطباق وزنه، RPE و تنوع حرکات
                  </span>
                </div>
              </div>

              {isSmartAnalysisOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isSmartAnalysisOpen && (
              <div className="p-4 pt-0 border-t border-slate-100 space-y-4 text-xs animate-fadeIn">
                {/* 4 KPIs Mini Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-slate-400 text-[10px] font-bold block">جلسات کامل‌شده:</span>
                    <span className="font-black text-slate-900">{currentWeekAnalysis.total_sessions_completed} از {currentWeekAnalysis.total_sessions_scheduled}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-slate-400 text-[10px] font-bold block">میانگین RPE:</span>
                    <span className="font-black text-orange-600">{currentWeekAnalysis.average_rpe > 0 ? currentWeekAnalysis.average_rpe.toFixed(1) : '-'} / ۱۰</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-slate-400 text-[10px] font-bold block">سطح خستگی:</span>
                    <span className="font-black text-slate-900">{currentWeekAnalysis.average_fatigue} / ۱۰</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-slate-400 text-[10px] font-bold block">استراتژی:</span>
                    <span className="font-black text-emerald-700">{currentWeekAnalysis.overall_strategy_decision}</span>
                  </div>
                </div>

                {/* Exercise Level Adaptations */}
                {selectedWeekNumber > 1 && currentWeekAnalysis.exercise_metrics && currentWeekAnalysis.exercise_metrics.length > 0 && (
                  <ExerciseChangeCard 
                    metrics={currentWeekAnalysis.exercise_metrics} 
                    adjustmentsList={activeProgramForWeek?.weekly_review?.adjustments_made_fa}
                  />
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setShowWhyChangedModal(true)}
                    className="text-orange-600 hover:text-orange-700 text-xs font-bold underline cursor-pointer"
                  >
                    مشاهده گزارش کامل مربی هوشمند ←
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* 8. COLLAPSIBLE: ADVANCED SCIENTIFIC DETAILS (Zero default clutter) */}
          {/* ======================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsAdvancedDetailsOpen(!isAdvancedDetailsOpen)}
              className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/80 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    اطلاعات پیشرفته و کارت هویت ورزشی
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    تاییدیه‌های علمی، بیومکانیک و مشخصات آنتروپومتریک
                  </span>
                </div>
              </div>

              {isAdvancedDetailsOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isAdvancedDetailsOpen && (
              <div className="p-4 pt-0 border-t border-slate-100 space-y-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-2 flex-wrap pt-3">
                  {program.sport_identity_card && (
                    <button
                      onClick={() => setShowIdentityCardModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>کارت هویت ورزشی</span>
                    </button>
                  )}
                  {program.workout_generation_report && (
                    <button
                      onClick={() => setShowGenerationReportModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>فیلترینگ تجهیزات و ایمنی</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 9. MODALS & SUB-VIEWS (Preserved with 100% integrity) */}
      {/* ========================================================================= */}

      {/* ADD EXERCISE MODAL */}
      {showAddExerciseModal && heroSession && (
        <AddExerciseModal
          isOpen={showAddExerciseModal}
          onClose={() => setShowAddExerciseModal(false)}
          day={heroSession}
          weekNumber={selectedWeekNumber}
          assessment={assessment}
          onAddExercise={(newPrescribed) => {
            if (onAddExerciseToProgram) {
              onAddExerciseToProgram(selectedWeekNumber, heroSession.day_number, newPrescribed);
            }
          }}
        />
      )}

      {/* WHY CHANGED MODAL */}
      {showWhyChangedModal && (
        <WhyChangedModal
          analysis={currentWeekAnalysis}
          activeProgramForWeek={activeProgramForWeek}
          selectedWeekNumber={selectedWeekNumber}
          onClose={() => setShowWhyChangedModal(false)}
        />
      )}

      {/* WORKOUT LOGGING MODAL (Workout Player) */}
      {isLiveLoggingActive && heroSession && (
        <WorkoutLoggingModal
          day={heroSession}
          weekNumber={selectedWeekNumber}
          programId={program.id}
          assessment={assessment}
          onClose={() => setIsLiveLoggingActive(false)}
          onFinishSession={handleSessionFinish}
        />
      )}

      {/* SESSION COMPLETION MODAL */}
      {showSessionCompletionModal && heroSession && (
        <SessionCompletionModal
          day={heroSession}
          weekNumber={selectedWeekNumber}
          completedDaysCount={completedWorkoutDaysCount}
          totalDaysCount={totalWorkoutDaysCount}
          weeklyProgressPercent={weeklyProgressPercent}
          onClose={() => setShowSessionCompletionModal(false)}
          onViewWeekAnalysis={() => setShowWeeklyAnalysisModal(true)}
        />
      )}

      {/* WEEK COMPLETION MODAL */}
      {showWeekCompletionModal && (
        <WeekCompletionModal
          completedWeekNumber={selectedWeekNumber}
          nextWeekNumber={Math.min(4, selectedWeekNumber + 1)}
          onClose={() => setShowWeekCompletionModal(false)}
          onAnalyzeAndGenerateNextWeek={() => {
            const nextWeekNum = Math.min(4, selectedWeekNumber + 1);
            if (onGenerateAdaptiveWeek) {
              onGenerateAdaptiveWeek(nextWeekNum);
            } else if (onAdaptProgramForNextWeek) {
              onAdaptProgramForNextWeek();
            }
            setSelectedWeekNumber(nextWeekNum);
          }}
        />
      )}

      {/* WEEKLY ADAPTIVE PERFORMANCE ANALYSIS MODAL */}
      {showWeeklyAnalysisModal && (
        <WeeklyAnalysisModal
          analysis={currentWeekAnalysis}
          onClose={() => setShowWeeklyAnalysisModal(false)}
          onGenerateNextWeek={() => {
            const nextWeekNum = Math.min(4, selectedWeekNumber + 1);
            if (onGenerateAdaptiveWeek) {
              onGenerateAdaptiveWeek(nextWeekNum);
            } else if (onAdaptProgramForNextWeek) {
              onAdaptProgramForNextWeek();
            }
            setSelectedWeekNumber(nextWeekNum);
          }}
          isNextWeekUnlocked={unlockStatuses[selectedWeekNumber + 1]?.is_unlocked || overrideUnlock}
        />
      )}

      {/* SPORT IDENTITY CARD MODAL */}
      {showIdentityCardModal && program.sport_identity_card && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 text-right">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">کارت هویت ورزشی (Sport Identity Card)</h3>
              </div>
              <button onClick={() => setShowIdentityCardModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">مشخصات فیزیکی</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                  <div>سن: <strong>{program.sport_identity_card.physicalProfile.age} سال</strong></div>
                  <div>قد: <strong>{program.sport_identity_card.physicalProfile.heightCm} cm</strong></div>
                  <div>وزن: <strong>{program.sport_identity_card.physicalProfile.weightKg} kg</strong></div>
                  <div>شاخص BMI: <strong>{program.sport_identity_card.physicalProfile.bmi}</strong></div>
                  <div>تخمین چربی: <strong>{program.sport_identity_card.physicalProfile.bodyFatEstimate}</strong></div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100 space-y-2">
                <span className="font-bold text-orange-950 text-xs block">پروفایل قدرت عضلانی</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between font-bold mb-1"><span>قدرت فشار (Push):</span><span>{program.sport_identity_card.strengthProfile.pushStrengthScore}/۱۰۰</span></div>
                    <div className="w-full bg-orange-200 rounded-full h-1.5"><div className="bg-orange-600 h-1.5 rounded-full" style={{ width: `${program.sport_identity_card.strengthProfile.pushStrengthScore}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold mb-1"><span>قدرت کشش (Pull):</span><span>{program.sport_identity_card.strengthProfile.pullStrengthScore}/۱۰۰</span></div>
                    <div className="w-full bg-amber-200 rounded-full h-1.5"><div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${program.sport_identity_card.strengthProfile.pullStrengthScore}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold mb-1"><span>قدرت پا (Leg):</span><span>{program.sport_identity_card.strengthProfile.legStrengthScore}/۱۰۰</span></div>
                    <div className="w-full bg-emerald-200 rounded-full h-1.5"><div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${program.sport_identity_card.strengthProfile.legStrengthScore}%` }}></div></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowIdentityCardModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
