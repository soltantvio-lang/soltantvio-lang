import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  WorkoutDay, 
  PrescribedExercise, 
  Exercise, 
  WorkoutLog, 
  ExerciseLogItem,
  UserAssessment
} from '../types';
import { EXERCISES_DATABASE } from '../data/exercises';
import { findSmartAlternatives } from '../utils/workoutEngine';
import { ExerciseAlternativeModal } from './ExerciseAlternativeModal';
import { 
  Dumbbell, 
  CheckCircle2, 
  Flame, 
  Clock, 
  X, 
  AlertTriangle, 
  Play, 
  Save, 
  Info, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Sparkles,
  Timer,
  SkipForward,
  RotateCcw,
  List,
  Maximize2,
  Check,
  Plus,
  Minus,
  Smile,
  Meh,
  Frown,
  Activity,
  ShieldCheck,
  Youtube,
  Shuffle,
  Share2
} from 'lucide-react';

interface SetLogData {
  reps: number;
  weight: number;
  rpe: number;
  completed: boolean;
  pain: 'none' | 'mild' | 'moderate' | 'severe';
  painJoint?: string;
  notes?: string;
  original_exercise_id?: string;
  exercise_performed_id?: string;
  exercise_source?: 'planned' | 'user_alternative' | 'adaptive_rotation';
}

interface WorkoutLoggingModalProps {
  day: WorkoutDay;
  weekNumber: number;
  programId: string;
  assessment?: UserAssessment | null;
  onClose: () => void;
  onFinishSession: (log: WorkoutLog) => void;
  initialLogs?: Record<string, SetLogData[]>;
}

export const WorkoutLoggingModal: React.FC<WorkoutLoggingModalProps> = ({
  day,
  weekNumber,
  programId,
  assessment,
  onClose,
  onFinishSession,
  initialLogs
}) => {
  // Session exercises list (supports in-session alternative swaps without modifying persistent program state)
  const [exercisesList, setExercisesList] = useState<PrescribedExercise[]>(() => {
    return [
      ...(day.main_workout || []),
      ...(day.accessory || []),
      ...(day.finisher || [])
    ].map(pe => ({
      ...pe,
      original_exercise_id: pe.original_exercise_id || pe.exercise_id,
      exercise_source: pe.exercise_source || 'planned'
    }));
  });

  const allExercises = exercisesList;

  // Alternative Modal State
  const [showAlternativeModal, setShowAlternativeModal] = useState<boolean>(false);

  // Mode: 'player' (Step-by-Step Set-by-Set) | 'table' (Overview List) | 'summary' (Session Finished)
  const [viewMode, setViewMode] = useState<'player' | 'table' | 'summary'>('player');

  // Active indices in Player Mode
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(0);

  // Video/Guide popover
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Set-by-Set Logs State
  const [logsState, setLogsState] = useState<Record<string, SetLogData[]>>(() => {
    if (initialLogs && Object.keys(initialLogs).length > 0) {
      return initialLogs;
    }
    const initial: Record<string, SetLogData[]> = {};
    allExercises.forEach(pe => {
      const targetRepsNum = parseInt(pe.target_reps) || 10;
      initial[pe.exercise_id] = Array.from({ length: pe.sets }, () => ({
        reps: targetRepsNum,
        weight: 0,
        rpe: 8,
        completed: false,
        pain: 'none',
        painJoint: undefined,
        notes: '',
        original_exercise_id: pe.original_exercise_id || pe.exercise_id,
        exercise_performed_id: pe.exercise_id,
        exercise_source: pe.exercise_source || 'planned'
      }));
    });
    return initial;
  });

  // Overall session metrics
  const [sessionFatigue, setSessionFatigue] = useState<number>(5);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Rest Timer State
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(60);
  const [restTotalSeconds, setRestTotalSeconds] = useState<number>(60);

  // Show "More Options" in Player Mode (Weight, Pain, Notes)
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [showPreciseRpe, setShowPreciseRpe] = useState<boolean>(false);

  // Helper to fetch full exercise data
  const getExerciseObj = (id: string): Exercise => {
    return EXERCISES_DATABASE.find(e => e.id === id) || EXERCISES_DATABASE[0];
  };

  const activePrescribed = allExercises[currentExerciseIndex] || allExercises[0];
  const activeExerciseObj = getExerciseObj(activePrescribed.exercise_id);
  const originalExerciseObj = getExerciseObj(activePrescribed.original_exercise_id || activePrescribed.exercise_id);
  const isCurrentExerciseReplaced = activePrescribed.exercise_id !== (activePrescribed.original_exercise_id || activePrescribed.exercise_id);

  // Calculate safe alternatives for active exercise (max 2)
  const activeAlternatives = useMemo(() => {
    return findSmartAlternatives(activePrescribed.exercise_id, assessment, 2);
  }, [activePrescribed.exercise_id, assessment]);

  const currentExerciseSets = logsState[activePrescribed.exercise_id] || [];
  const activeSetData = currentExerciseSets[currentSetIndex] || {
    reps: 10,
    weight: 0,
    rpe: 8,
    completed: false,
    pain: 'none'
  };

  const hasAnyLoggedSetForActive = currentExerciseSets.some(s => s.completed);

  // Handler to select an alternative for active exercise in current session
  const handleSelectAlternativeForActive = (newEx: Exercise) => {
    const oldExId = activePrescribed.exercise_id;
    const originalExId = activePrescribed.original_exercise_id || oldExId;
    const newExId = newEx.id;

    if (oldExId === newExId) return;

    // 1. Update exercisesList
    setExercisesList(prevList => {
      const copy = [...prevList];
      copy[currentExerciseIndex] = {
        ...copy[currentExerciseIndex],
        exercise_id: newExId,
        original_exercise_id: originalExId,
        exercise_source: 'user_alternative'
      };
      return copy;
    });

    // 2. Transfer or initialize logsState safely
    setLogsState(prevLogs => {
      const existingSets = prevLogs[oldExId];
      const targetRepsNum = parseInt(activePrescribed.target_reps) || 10;
      
      const newSets: SetLogData[] = existingSets 
        ? existingSets.map(s => ({
            ...s,
            weight: 0, // reset weight when switching to different exercise
            original_exercise_id: originalExId,
            exercise_performed_id: newExId,
            exercise_source: 'user_alternative'
          }))
        : Array.from({ length: activePrescribed.sets }, () => ({
            reps: targetRepsNum,
            weight: 0,
            rpe: 8,
            completed: false,
            pain: 'none',
            painJoint: undefined,
            notes: '',
            original_exercise_id: originalExId,
            exercise_performed_id: newExId,
            exercise_source: 'user_alternative'
          }));

      const updated = { ...prevLogs };
      delete updated[oldExId];
      updated[newExId] = newSets;
      return updated;
    });
  };

  // Handler to restore original exercise
  const handleRestoreOriginalForActive = () => {
    const originalExId = activePrescribed.original_exercise_id;
    if (!originalExId || originalExId === activePrescribed.exercise_id) return;

    const originalEx = getExerciseObj(originalExId);
    handleSelectAlternativeForActive(originalEx);

    setExercisesList(prevList => {
      const copy = [...prevList];
      copy[currentExerciseIndex] = {
        ...copy[currentExerciseIndex],
        exercise_source: 'planned'
      };
      return copy;
    });
  };

  // Haptic feedback trigger for mobile devices
  const triggerHaptic = (pattern: number | number[] = 35) => {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback if permission not granted
      }
    }
  };

  // Rest Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRestTimerActive && restSecondsRemaining > 0) {
      interval = setInterval(() => {
        setRestSecondsRemaining(prev => {
          if (prev <= 1) {
            triggerHaptic([40, 30, 40]);
            setIsRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestTimerActive, restSecondsRemaining]);

  // Overall Progress calculation
  const totalSetsCount = useMemo(() => {
    return allExercises.reduce((sum, pe) => sum + pe.sets, 0);
  }, [allExercises]);

  const completedSetsCount = useMemo(() => {
    let count = 0;
    (Object.values(logsState) as SetLogData[][]).forEach(sets => {
      sets.forEach(s => {
        if (s.completed) count++;
      });
    });
    return count;
  }, [logsState]);

  const progressPercent = totalSetsCount > 0 
    ? Math.round((completedSetsCount / totalSetsCount) * 100) 
    : 0;

  // Pain reports count
  const painReports = useMemo(() => {
    const list: { exerciseName: string; setNum: number; severity: string; joint?: string }[] = [];
    allExercises.forEach(pe => {
      const sets = logsState[pe.exercise_id] || [];
      const ex = getExerciseObj(pe.exercise_id);
      sets.forEach((s, idx) => {
        if (s.pain && s.pain !== 'none') {
          list.push({
            exerciseName: ex.name_fa,
            setNum: idx + 1,
            severity: s.pain === 'mild' ? 'خفیف' : s.pain === 'moderate' ? 'متوسط' : 'شدید',
            joint: s.painJoint
          });
        }
      });
    });
    return list;
  }, [logsState, allExercises]);

  // Handler to update a specific set's property
  const handleUpdateActiveSet = (field: keyof SetLogData, value: any) => {
    setLogsState(prev => {
      const curSets = [...(prev[activePrescribed.exercise_id] || [])];
      if (!curSets[currentSetIndex]) return prev;
      curSets[currentSetIndex] = {
        ...curSets[currentSetIndex],
        [field]: value
      };
      return {
        ...prev,
        [activePrescribed.exercise_id]: curSets
      };
    });
  };

  const handleUpdateAnySet = (exId: string, setIdx: number, field: keyof SetLogData, value: any) => {
    setLogsState(prev => {
      const curSets = [...(prev[exId] || [])];
      if (!curSets[setIdx]) return prev;
      curSets[setIdx] = {
        ...curSets[setIdx],
        [field]: value
      };
      return {
        ...prev,
        [exId]: curSets
      };
    });
  };

  // Log current set and advance
  const handleLogAndCompleteCurrentSet = () => {
    triggerHaptic(40);
    // Mark active set as completed
    handleUpdateActiveSet('completed', true);

    const isLastSetOfExercise = currentSetIndex >= activePrescribed.sets - 1;
    const isLastExercise = currentExerciseIndex >= allExercises.length - 1;

    if (isLastSetOfExercise && isLastExercise) {
      // Finished all sets in session!
      triggerHaptic([60, 40, 60]);
      setViewMode('summary');
      setIsRestTimerActive(false);
      return;
    }

    // Trigger Rest Timer
    const restSecs = activePrescribed.rest_seconds || 60;
    setRestTotalSeconds(restSecs);
    setRestSecondsRemaining(restSecs);
    setIsRestTimerActive(true);

    // Prepare next set position
    if (isLastSetOfExercise) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
    } else {
      setCurrentSetIndex(prev => prev + 1);
    }
  };

  const handleSkipRestTimer = () => {
    triggerHaptic(25);
    setIsRestTimerActive(false);
    setRestSecondsRemaining(0);
  };

  const handleAddRestTime = (seconds: number) => {
    triggerHaptic(25);
    setRestSecondsRemaining(prev => Math.max(5, prev + seconds));
  };

  // Submit Final Workout Log
  const handleFinalSubmit = () => {
    const logItems: ExerciseLogItem[] = [];

    (Object.entries(logsState) as [string, SetLogData[]][]).forEach(([exId, setsData]) => {
      setsData.forEach((setData, index) => {
        let noteText = '';
        if (setData.pain && setData.pain !== 'none') {
          noteText = `گزارش درد: ${setData.pain === 'mild' ? 'خفیف' : setData.pain === 'moderate' ? 'متوسط' : 'شدید'}${setData.painJoint ? ` در ${setData.painJoint}` : ''}`;
        }
        if (setData.notes) {
          noteText = noteText ? `${noteText} | ${setData.notes}` : setData.notes;
        }

        logItems.push({
          exercise_id: exId,
          exercise_original_id: setData.original_exercise_id || exId,
          exercise_performed_id: setData.exercise_performed_id || exId,
          exercise_source: setData.exercise_source || 'planned',
          set_number: index + 1,
          reps_completed: setData.reps,
          weight_kg: setData.weight,
          rpe: setData.rpe,
          difficulty_rating_1_10: setData.rpe,
          notes: noteText || undefined
        });
      });
    });

    const newLog: WorkoutLog = {
      id: `log_w${weekNumber}_d${day.day_number}_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      program_id: programId,
      week_number: weekNumber,
      day_number: day.day_number,
      duration_minutes: day.time_budget_breakdown?.total_estimated_mins || 45,
      logs: logItems,
      overall_fatigue_1_10: sessionFatigue,
      notes: sessionNotes || undefined
    };

    onFinishSession(newLog);
  };

  // Simplified 4-button RPE definitions
  const simplifiedRpeOptions = [
    { value: 6, label: 'سبک', desc: 'بیش از ۳ تکرار ذخیره', emoji: '🙂', color: 'border-emerald-300 hover:bg-emerald-50 text-emerald-800' },
    { value: 8, label: 'متوسط', desc: '۲ تکرار تا ناتوانی', emoji: '😐', color: 'border-amber-300 hover:bg-amber-50 text-amber-800' },
    { value: 9, label: 'سخت', desc: '۱ تکرار تا ناتوانی', emoji: '😓', color: 'border-orange-300 hover:bg-orange-50 text-orange-800' },
    { value: 10, label: 'بسیار سخت', desc: 'ناتوانی کامل (۰ ذخیره)', emoji: '🥵', color: 'border-rose-300 hover:bg-rose-50 text-rose-800' },
  ];

  const jointsList = ['شانه', 'زانو', 'کمر', 'مچ دست', 'آرنج', 'گردن', 'مچ پا'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-right">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-orange-100 animate-fadeIn overflow-hidden">
        
        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 text-white shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-black text-white">
                هفته {weekNumber} — روز {day.day_number}: {day.title_fa.replace(/^روز \d+:\s*/, '')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher Button */}
              <button
                onClick={() => setViewMode(prev => prev === 'player' ? 'table' : 'player')}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="تغییر حالت نمایش"
              >
                {viewMode === 'player' ? (
                  <>
                    <List className="w-3.5 h-3.5 text-orange-400" />
                    <span className="hidden sm:inline">مشاهده فهرست ست‌ها</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-orange-400" />
                    <span className="hidden sm:inline">حالت اجرای زنده</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="خروج"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>پیشرفت تمرین امروز: {completedSetsCount} از {totalSetsCount} ست تکمیل شد</span>
              <span className="text-amber-400 font-black">{progressPercent}٪</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* REST TIMER BANNER (Active between sets, sticky for mobile thumb reach) */}
        {isRestTimerActive && (
          <div className="sticky top-0 z-30 p-3 bg-slate-900 border-b border-orange-500/40 text-white flex items-center justify-between px-4 animate-fadeIn shrink-0 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                <Timer className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-black block text-orange-400">استراحت بین ست‌ها</span>
                <span className="text-[10px] text-slate-300">آماده‌سازی برای ست بعدی</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg bg-orange-950/60 border border-orange-500/40 text-orange-300 px-3 py-1 rounded-xl">
                {restSecondsRemaining} ثانیه
              </span>
              <button
                type="button"
                aria-label="افزودن ۱۵ ثانیه به استراحت"
                onClick={() => handleAddRestTime(15)}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black transition cursor-pointer border border-slate-700"
              >
                +۱۵ث
              </button>
              <button
                type="button"
                aria-label="رد کردن استراحت و شروع ست بعدی"
                onClick={handleSkipRestTimer}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <SkipForward className="w-4 h-4" />
                <span>شروع ست</span>
              </button>
            </div>
          </div>
        )}

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* VIEW 1: STEP-BY-STEP PLAYER (Simplified UX) */}
          {viewMode === 'player' && (
            <div className="space-y-5">

              {/* Active Exercise Card Header */}
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-xl bg-orange-600 text-white text-xs font-black flex items-center justify-center">
                        {currentExerciseIndex + 1}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        حرکت {currentExerciseIndex + 1} از {allExercises.length}
                      </span>
                      {isCurrentExerciseReplaced && (
                        <span className="text-[10px] bg-orange-100 text-orange-900 border border-orange-200 px-2 py-0.5 rounded-md font-bold">
                          جایگزین فعال
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {activeExerciseObj.name_fa}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {activeExerciseObj.name_en}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Safe Alternative Selector Button */}
                    <button
                      type="button"
                      onClick={() => setShowAlternativeModal(true)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      title="انتخاب حرکت معادل و جایگزین برای این جلسه"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-orange-600" />
                      <span className="hidden sm:inline">جایگزین حرکت</span>
                    </button>

                    <button
                      onClick={() => setShowGuideModal(true)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-orange-50 text-orange-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    >
                      <Youtube className="w-4 h-4 text-orange-600" />
                      <span>آموزش</span>
                    </button>
                  </div>
                </div>

                {/* Target Specs Chips */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">هدف تکرار:</span>
                    <span className="font-black text-slate-900">{activePrescribed.target_reps}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">تمپو:</span>
                    <span className="font-black font-mono text-slate-900">{activePrescribed.tempo || '2-0-1-0'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">استراحت:</span>
                    <span className="font-black text-slate-900">{activePrescribed.rest_seconds} ثانیه</span>
                  </div>
                </div>

                {/* Sets Progress Pills */}
                <div className="flex items-center gap-1.5 pt-1">
                  {currentExerciseSets.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSetIndex(idx)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                        idx === currentSetIndex
                          ? 'bg-orange-600 text-white shadow-xs'
                          : s.completed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {s.completed && <Check className="w-3 h-3 text-emerald-700" />}
                      <span>ست {idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIVE SET LOGGING CARD */}
              <div className="p-5 rounded-3xl bg-white border-2 border-orange-500/80 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-orange-100 text-orange-900 px-3 py-1 rounded-full">
                      ست جاری: {currentSetIndex + 1} از {activePrescribed.sets}
                    </span>
                    {activeSetData.completed && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ثبت شده
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-bold">
                    هدف: {activePrescribed.target_reps} تکرار
                  </span>
                </div>

                {/* 1. REPS INPUT (Large & Bold with +/- buttons) */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span>چند تکرار انجام دادی؟</span>
                    <span className="text-[11px] text-orange-600 font-normal">تکرار واقعی انجام‌شده</span>
                  </label>

                  <div className="flex items-center justify-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      aria-label="کاهش یک تکرار"
                      onClick={() => handleUpdateActiveSet('reps', Math.max(0, activeSetData.reps - 1))}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-xl flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Minus className="w-6 h-6" />
                    </button>

                    <div className="text-center w-28">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        aria-label="تعداد تکرار"
                        value={activeSetData.reps}
                        onChange={(e) => handleUpdateActiveSet('reps', parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-center font-black text-3xl sm:text-4xl text-slate-900 focus:outline-hidden font-numeric"
                      />
                      <span className="text-[11px] text-slate-500 font-bold block">تکرار</span>
                    </div>

                    <button
                      type="button"
                      aria-label="افزایش یک تکرار"
                      onClick={() => handleUpdateActiveSet('reps', activeSetData.reps + 1)}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-xl flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* 2. SIMPLIFIED RPE (Emoji-based, 1-click selection) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800">
                      میزان فشار این ست چطور بود؟ (RPE)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPreciseRpe(prev => !prev)}
                      className="text-[10px] text-orange-600 hover:underline font-bold cursor-pointer"
                    >
                      {showPreciseRpe ? 'حالت ساده' : 'تنظیم عددی دقیق (۱ تا ۱۰)'}
                    </button>
                  </div>

                  {!showPreciseRpe ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {simplifiedRpeOptions.map(opt => {
                        const isSelected = activeSetData.rpe === opt.value || 
                          (opt.value === 8 && (activeSetData.rpe === 7 || activeSetData.rpe === 8));

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleUpdateActiveSet('rpe', opt.value)}
                            className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : `bg-white ${opt.color}`
                            }`}
                          >
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className="font-black text-xs">{opt.label}</span>
                            <span className={`text-[9px] ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs font-black text-slate-900">
                        <span>RPE انتخابی:</span>
                        <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-lg">
                          RPE {activeSetData.rpe} / ۱۰
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={activeSetData.rpe}
                        onChange={(e) => handleUpdateActiveSet('rpe', parseInt(e.target.value))}
                        className="w-full accent-orange-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>۱ (بسیار سبک)</span>
                        <span>۷-۸ (بهینه)</span>
                        <span>۱۰ (ناتوانی کامل)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. OPTIONAL COLLAPSIBLE SECTION: Weight, Pain & Notes */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowMoreOptions(prev => !prev)}
                    className="w-full py-2 flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      <span>گزینه‌های تکمیلی (وزنه، پایش درد مفاصل، یادداشت)</span>
                    </span>
                    {showMoreOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showMoreOptions && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 mt-2 animate-fadeIn text-xs">
                      
                      {/* Weight (kg) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-700 block">
                          وزنه کاربردی (کیلوگرم):
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="کاهش ۲.۵ کیلوگرم وزنه"
                            onClick={() => handleUpdateActiveSet('weight', Math.max(0, activeSetData.weight - 2.5))}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-800 text-xs shadow-2xs"
                          >
                            -۲.۵
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            aria-label="وزنه بر حسب کیلوگرم"
                            value={activeSetData.weight}
                            onChange={(e) => handleUpdateActiveSet('weight', parseFloat(e.target.value) || 0)}
                            className="flex-1 min-h-[44px] bg-white border border-slate-300 rounded-xl py-2 text-center font-black text-slate-900 font-numeric text-base"
                            placeholder="وزن (kg)"
                          />
                          <button
                            type="button"
                            aria-label="افزایش ۲.۵ کیلوگرم وزنه"
                            onClick={() => handleUpdateActiveSet('weight', activeSetData.weight + 2.5)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-800 text-xs shadow-2xs"
                          >
                            +۲.۵
                          </button>
                        </div>
                      </div>

                      {/* Pain Monitoring (Safety Engine) */}
                      <div className="space-y-2 pt-1 border-t border-slate-200/70">
                        <label className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>آیا در این ست احساس درد یا ناراحتی مفصلی داشتی؟</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveSet('pain', 'none')}
                            className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                              activeSetData.pain === 'none'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            خیر (کاملاً ایمن)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveSet('pain', 'mild')}
                            className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                              activeSetData.pain !== 'none'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            بله (گزارش درد)
                          </button>
                        </div>

                        {activeSetData.pain !== 'none' && (
                          <div className="space-y-2 p-3 bg-rose-50 rounded-xl border border-rose-200 animate-fadeIn">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-rose-900 block">شدت درد:</label>
                              <div className="flex gap-1.5">
                                {(['mild', 'moderate', 'severe'] as const).map(sev => (
                                  <button
                                    key={sev}
                                    type="button"
                                    onClick={() => handleUpdateActiveSet('pain', sev)}
                                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${
                                      activeSetData.pain === sev
                                        ? 'bg-rose-700 text-white'
                                        : 'bg-white text-rose-800 border border-rose-200'
                                    }`}
                                  >
                                    {sev === 'mild' ? 'خفیف' : sev === 'moderate' ? 'متوسط' : 'شدید'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-rose-900 block">مفصل / ناحیه درد:</label>
                              <div className="flex flex-wrap gap-1">
                                {jointsList.map(j => (
                                  <button
                                    key={j}
                                    type="button"
                                    onClick={() => handleUpdateActiveSet('painJoint', j)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      activeSetData.painJoint === j
                                        ? 'bg-rose-800 text-white'
                                        : 'bg-white text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {j}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* PRIMARY ACTION: LOG THIS SET */}
                <button
                  type="button"
                  onClick={handleLogAndCompleteCurrentSet}
                  className="w-full min-h-[54px] sm:min-h-[58px] py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-base font-black shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    ثبت این ست و شروع استراحت ({currentSetIndex + 1} از {activePrescribed.sets})
                  </span>
                </button>
              </div>

              {/* Navigation Between Exercises */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={currentExerciseIndex === 0}
                  onClick={() => {
                    setCurrentExerciseIndex(prev => Math.max(0, prev - 1));
                    setCurrentSetIndex(0);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>حرکت قبلی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('summary')}
                  className="text-orange-700 hover:text-orange-900 font-bold underline cursor-pointer"
                >
                  اتمام و ثبت نهایی جلسه
                </button>

                <button
                  type="button"
                  disabled={currentExerciseIndex >= allExercises.length - 1}
                  onClick={() => {
                    setCurrentExerciseIndex(prev => Math.min(allExercises.length - 1, prev + 1));
                    setCurrentSetIndex(0);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <span>حرکت بعدی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* VIEW 2: OVERVIEW TABLE (Batch inspection & edit) */}
          {viewMode === 'table' && (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-orange-950 flex items-center justify-between">
                <span>نمای مرور کلی تمام ست‌ها — امکان مشاهده یا ویرایش مستقیم ست‌ها</span>
                <button
                  onClick={() => setViewMode('player')}
                  className="px-3 py-1 bg-orange-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  بازگشت به اجرای زنده
                </button>
              </div>

              <div className="space-y-4">
                {allExercises.map((pe, exIdx) => {
                  const exObj = getExerciseObj(pe.exercise_id);
                  const sets = logsState[pe.exercise_id] || [];

                  return (
                    <div key={`${pe.exercise_id}-${exIdx}`} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-black text-xs text-slate-900">{exIdx + 1}. {exObj.name_fa}</span>
                        <span className="text-[11px] text-slate-500 font-bold">{pe.sets} ست × {pe.target_reps}</span>
                      </div>

                      <div className="space-y-2">
                        {sets.map((s, sIdx) => (
                          <div 
                            key={sIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                              s.completed ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span className="font-bold text-slate-700 w-12">ست {sIdx + 1}:</span>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold">تکرار:</span>
                              <input
                                type="number"
                                value={s.reps}
                                onChange={(e) => handleUpdateAnySet(pe.exercise_id, sIdx, 'reps', parseInt(e.target.value) || 0)}
                                className="w-14 bg-white border border-slate-300 rounded-lg p-1 text-center font-bold text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold">RPE:</span>
                              <select
                                value={s.rpe}
                                onChange={(e) => handleUpdateAnySet(pe.exercise_id, sIdx, 'rpe', parseInt(e.target.value))}
                                className="bg-white border border-slate-300 rounded-lg p-1 text-xs font-bold"
                              >
                                {[6, 7, 8, 9, 10].map(r => (
                                  <option key={r} value={r}>RPE {r}</option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpdateAnySet(pe.exercise_id, sIdx, 'completed', !s.completed)}
                              className={`p-1.5 rounded-lg border transition ${
                                s.completed ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-300'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: SESSION COMPLETION REPORT */}
          {viewMode === 'summary' && (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">خلاصه گزارش تمرین امروز</h3>
                <p className="text-xs text-slate-600">
                  تمام ست‌ها آماده ثبت در پایگاه داده هوش مصنوعی مربی هستند.
                </p>
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `🔥 گزارش تمرین امروز من در فیت مکس (Fit Max):\nجلسه: ${day.title_fa || day.title}\nست‌های انجام شده: ${completedSetsCount} از ${totalSetsCount} (${progressPercent}٪ تکمیل)\n\nدریافت برنامه هوشمند تمرینی در:\n${window.location.origin}`;
                      if (navigator.share) {
                        navigator.share({
                          title: 'کارنامه تمرین فیت مکس',
                          text: shareText,
                          url: window.location.origin
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(shareText);
                        alert('گزارش تمرین در حافظه کپی شد!');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition border border-orange-200 cursor-pointer active:scale-95"
                    aria-label="اشتراک‌گذاری کارنامه تمرین"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>اشتراک‌گذاری کارنامه تمرین</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px]">تعداد ست‌های تکمیل‌شده</span>
                  <span className="text-lg font-black text-slate-900">{completedSetsCount} از {totalSetsCount}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px]">درصد تکمیل برنامه</span>
                  <span className="text-lg font-black text-emerald-600">{progressPercent}٪</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px]">وضعیت ایمنی و مفاصل</span>
                  <span className={`text-base font-black ${painReports.length > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {painReports.length > 0 ? `${painReports.length} هشدار درد` : 'کاملاً ایمن ✓'}
                  </span>
                </div>
              </div>

              {/* Overall Fatigue Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-right text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-orange-600" />
                    <span>میزان خستگی کلی جلسه امروز:</span>
                  </span>
                  <span className="font-black text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">
                    {sessionFatigue} از ۱۰
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sessionFatigue}
                  onChange={(e) => setSessionFatigue(parseInt(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>۱ (کاملاً رفرش)</span>
                  <span>۵ (خستگی متعادل)</span>
                  <span>۱۰ (تخلیه کامل توان)</span>
                </div>
              </div>

              {/* Pain summary notification if any */}
              {painReports.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-right text-xs space-y-1 text-rose-950">
                  <span className="font-black flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>گزارش دردهای ثبت شده جهت انطباق ایمنی هفته بعد:</span>
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-rose-800 pr-2">
                    {painReports.map((p, idx) => (
                      <li key={idx}>
                        حرکت {p.exerciseName} (ست {p.setNum}): درد {p.severity} {p.joint ? `در ناحیه ${p.joint}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Session Notes */}
              <div className="text-right space-y-1 text-xs">
                <label className="font-black text-slate-800 block">یادداشت برای مربی هوشمند (اختیاری):</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="مثال: انرژی خوبی داشتم، در ست دوم وزنه را افزایش دادم..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:border-orange-500"
                />
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM FOOTER BAR */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            انصراف و بستن
          </button>

          {viewMode !== 'summary' ? (
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>پایان و ثبت جلسه</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت نهایی و ثبت در کارنامه ورزشی 🔥</span>
            </button>
          )}
        </div>

      </div>

      {/* QUICK VIDEO / GUIDE POPOVER MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-right">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-slate-900 text-base">{activeExerciseObj.name_fa}</h4>
                <span className="text-xs text-slate-400">{activeExerciseObj.name_en}</span>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeExerciseObj.youtube_embed_url ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
                <iframe
                  src={activeExerciseObj.youtube_embed_url}
                  title={activeExerciseObj.name_fa}
                  className="w-full h-full border-0"
                  allowFullScreen
                ></iframe>
              </div>
            ) : null}

            <div className="space-y-2 text-xs text-slate-700 bg-orange-50 p-3.5 rounded-2xl border border-orange-100">
              <span className="font-black text-orange-950 block">نکات کلیدی اجرای حرکت:</span>
              <p>{activeExerciseObj.instructions}</p>
              <p><strong>تنفس:</strong> {activeExerciseObj.breathing}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXERCISE ALTERNATIVES MODAL */}
      {showAlternativeModal && (
        <ExerciseAlternativeModal
          isOpen={showAlternativeModal}
          onClose={() => setShowAlternativeModal(false)}
          currentExercise={activeExerciseObj}
          originalExercise={originalExerciseObj}
          alternatives={activeAlternatives}
          hasLoggedSets={hasAnyLoggedSetForActive}
          onSelectAlternative={handleSelectAlternativeForActive}
          onRestoreOriginal={isCurrentExerciseReplaced ? handleRestoreOriginalForActive : undefined}
        />
      )}

    </div>
  );
};
