import {
  UserAssessment,
  FitnessLevel,
  GoalType,
  WorkoutProgram,
  WorkoutLog,
  PrescribedExercise,
  ExerciseRole,
  ExerciseAdaptationAction
} from '../types';
import { EXERCISES_DATABASE } from '../data/exercises';

// =========================================================================
// WEEK PERFORMANCE AUDIT & ADAPTIVE DECISION DATA STRUCTURES
// =========================================================================

export interface ExercisePerformanceMetric {
  exercise_id: string;
  exercise_name_fa: string;
  planned_sets: number;
  completed_sets: number;
  planned_reps: string;
  avg_actual_reps: number;
  avg_rpe: number;
  had_failure: boolean;
  reported_pain: boolean;
  pain_notes?: string;
  difficulty_score: number; // 1-10
  completion_rate: number; // 0 to 1
  adaptation_decision: ExerciseAdaptationAction;
  progression_method: 'reps' | 'sets' | 'difficulty' | 'tempo' | 'resistance' | 'none';
  adaptation_reason_fa: string;
}

export interface WeeklyPerformanceAnalysis {
  week_number: number;
  total_sessions_scheduled: number;
  total_sessions_completed: number;
  week_completion_rate: number; // 0 to 1
  is_week_completed: boolean;
  average_rpe: number;
  average_fatigue: number;
  failure_rate: number;
  has_pain_flag: boolean;
  pain_locations: string[];
  adherence_score: number; // 0 to 100
  recovery_status: 'optimal' | 'moderate' | 'fatigued' | 'compromised';
  overall_strategy_decision: 'Progression' | 'Consolidation' | 'Maintenance' | 'Deload' | 'Regression';
  strategy_reason_fa: string;
  strong_areas_fa: string[];
  weak_areas_fa: string[];
  exercise_metrics: ExercisePerformanceMetric[];
  generated_at: string;
}

export interface WeeklyUnlockStatus {
  week_number: number;
  is_unlocked: boolean;
  is_completed: boolean;
  completion_rate_percent: number;
  unlock_requirement_fa: string;
  can_generate_next: boolean;
}

// Configurable Completion Threshold (e.g. 70% of active sessions must be completed)
export const WEEK_COMPLETION_THRESHOLD_PERCENT = 70;

export function getLogsForWeek(logs: WorkoutLog[], programId?: string, weekNumber: number = 1): WorkoutLog[] {
  return logs.filter(l => {
    const isProgMatch = !programId || !l.program_id || l.program_id === programId;
    const logWeek = l.week_number || 1;
    return isProgMatch && logWeek === weekNumber;
  });
}

// =========================================================================
// 1. WEEKLY PERFORMANCE ANALYSIS ENGINE
// =========================================================================

export function analyzeWeeklyPerformance(
  program: WorkoutProgram,
  logs: WorkoutLog[],
  weekNumber: number
): WeeklyPerformanceAnalysis {
  const activeDays = program.days.filter(d => !d.is_rest_day);
  const totalScheduled = activeDays.length;

  // Filter logs STRICTLY for this specific week number
  const weekLogs = getLogsForWeek(logs, program.id, weekNumber);
  const completedDayNumbers = new Set(weekLogs.map(l => l.day_number));
  const activeCompletedCount = activeDays.filter(d => completedDayNumbers.has(d.day_number)).length;

  const weekCompletionRate = totalScheduled > 0 ? activeCompletedCount / totalScheduled : 0;
  const isWeekCompleted = (weekCompletionRate * 100) >= WEEK_COMPLETION_THRESHOLD_PERCENT;

  // Aggregate fatigue & RPE
  let totalFatigue = 0;
  let fatigueCount = 0;
  let totalRpe = 0;
  let rpeCount = 0;
  let failureCount = 0;
  let totalSetsCount = 0;
  const painFlags: string[] = [];

  // Group logs by exercise ID
  const exLogMap = new Map<string, {
    plannedSets: number;
    completedSets: number;
    plannedReps: string;
    actualReps: number[];
    rpes: number[];
    failures: boolean[];
    pains: boolean[];
  }>();

  // Populate planned exercises from active days
  activeDays.forEach(day => {
    [...day.main_workout, ...day.accessory, ...(day.finisher || [])].forEach(pe => {
      if (!exLogMap.has(pe.exercise_id)) {
        exLogMap.set(pe.exercise_id, {
          plannedSets: pe.sets,
          completedSets: 0,
          plannedReps: pe.target_reps,
          actualReps: [],
          rpes: [],
          failures: [],
          pains: []
        });
      }
    });
  });

  // Process actual user logs for this specific week
  weekLogs.forEach(log => {
    if (log.overall_fatigue_1_10) {
      totalFatigue += log.overall_fatigue_1_10;
      fatigueCount++;
    }

    log.logs.forEach(item => {
      totalSetsCount++;
      const valRpe = item.rpe || item.difficulty_rating_1_10 || 7;
      totalRpe += valRpe;
      rpeCount++;

      if (valRpe >= 9.5) failureCount++;

      const exEntry = exLogMap.get(item.exercise_id);
      if (exEntry) {
        exEntry.completedSets++;
        exEntry.actualReps.push(item.reps_completed);
        exEntry.rpes.push(valRpe);
        exEntry.failures.push(valRpe >= 9.5);
        // Check for pain notes or extreme difficulty
        if (item.notes && (item.notes.includes('درد') || item.notes.includes('pain') || item.notes.includes('آسیب'))) {
          exEntry.pains.push(true);
          painFlags.push(item.exercise_id);
        }
      }
    });
  });

  const avgFatigue = fatigueCount > 0 ? Math.round((totalFatigue / fatigueCount) * 10) / 10 : 5;
  const avgRpe = rpeCount > 0 ? Math.round((totalRpe / rpeCount) * 10) / 10 : 7;
  const failureRate = totalSetsCount > 0 ? Math.round((failureCount / totalSetsCount) * 100) : 0;

  // Recovery status calculation
  let recoveryStatus: 'optimal' | 'moderate' | 'fatigued' | 'compromised' = 'optimal';
  if (painFlags.length > 0) recoveryStatus = 'compromised';
  else if (avgFatigue >= 8 || avgRpe >= 9) recoveryStatus = 'fatigued';
  else if (avgFatigue >= 6.5 || avgRpe >= 8) recoveryStatus = 'moderate';

  // Individual Exercise Metrics & Adaptation Decisions
  const exerciseMetrics: ExercisePerformanceMetric[] = [];
  const strongAreas: string[] = [];
  const weakAreas: string[] = [];

  exLogMap.forEach((entry, exId) => {
    const exObj = EXERCISES_DATABASE.find(e => e.id === exId);
    const exName = exObj?.name_fa || exId;
    const avgExRpe = entry.rpes.length > 0 
      ? entry.rpes.reduce((a, b) => a + b, 0) / entry.rpes.length 
      : avgRpe;
    const avgActualReps = entry.actualReps.length > 0
      ? entry.actualReps.reduce((a, b) => a + b, 0) / entry.actualReps.length
      : parseInt(entry.plannedReps) || 10;
    const hadFail = entry.failures.some(Boolean);
    const hadPain = entry.pains.some(Boolean) || painFlags.includes(exId);
    const compRate = entry.plannedSets > 0 ? Math.min(1, entry.completedSets / entry.plannedSets) : 1;

    let decision: ExerciseAdaptationAction = 'PROGRESS';
    let progressionMethod: 'reps' | 'sets' | 'difficulty' | 'tempo' | 'resistance' | 'none' = 'reps';
    let reasonFa = '';

    if (hadPain) {
      decision = 'REPLACE';
      progressionMethod = 'none';
      reasonFa = `گزارش درد مفصلی/عضلانی در حین اجرا. جایگزینی با حرکت ایمن‌تر و بدون تنش دردناک.`;
      weakAreas.push(`آسیب یا درد در حرکت ${exName}`);
    } else if (compRate < 0.6 || avgExRpe >= 9.5) {
      decision = 'REGRESS';
      progressionMethod = 'none';
      reasonFa = `افت عملکرد و ناتوانی در تکمیل ست‌ها در RPE بالا (${avgExRpe.toFixed(1)}). کاهش حجم یا بازگشت به نسخه کنترل‌شده‌تر.`;
      weakAreas.push(`کاهش توان در ${exName}`);
    } else if (avgExRpe >= 8.5 || avgFatigue >= 8) {
      decision = 'KEEP';
      progressionMethod = 'none';
      reasonFa = `تکمیل ست‌ها با فشار بسیار بالا (RPE ${avgExRpe.toFixed(1)}). تثبیت بار و تکرارها جهت جلوگیری از بیش‌تمرینی و یادگیری عمیق تکنیک.`;
    } else if (avgExRpe <= 6.5 && compRate >= 0.9) {
      decision = 'PROGRESS';
      if (exObj?.progression_id) {
        progressionMethod = 'difficulty';
        reasonFa = `اجرای روان با RPE پایین (${avgExRpe.toFixed(1)}). ارتقا به نسخه پیشرفته‌تر حرکت (Progressive Overload).`;
      } else {
        progressionMethod = 'reps';
        reasonFa = `اجرای باکیفیت و کنترل عالی. افزایش ۲ تکرار در هر ست جهت تحریک فیبرهای جدید.`;
      }
      strongAreas.push(`عملکرد فوق‌العاده در ${exName}`);
    } else {
      decision = 'PROGRESS';
      progressionMethod = 'reps';
      reasonFa = `تکمیل موفق با فشار بهینه (RPE ${avgExRpe.toFixed(1)}). افزایش بار تدریجی با اورلود منظم.`;
    }

    exerciseMetrics.push({
      exercise_id: exId,
      exercise_name_fa: exName,
      planned_sets: entry.plannedSets,
      completed_sets: entry.completedSets,
      planned_reps: entry.plannedReps,
      avg_actual_reps: Math.round(avgActualReps),
      avg_rpe: Math.round(avgExRpe * 10) / 10,
      had_failure: hadFail,
      reported_pain: hadPain,
      difficulty_score: Math.round(avgExRpe),
      completion_rate: compRate,
      adaptation_decision: decision,
      progression_method: progressionMethod,
      adaptation_reason_fa: reasonFa
    });
  });

  // Overall Strategy Decision for Next Week
  let overallStrategy: 'Progression' | 'Consolidation' | 'Maintenance' | 'Deload' | 'Regression' = 'Progression';
  let strategyReasonFa = '';

  if (painFlags.length > 0) {
    overallStrategy = 'Maintenance';
    strategyReasonFa = 'به دلیل گزارش درد در برخی حرکات، اولویت بر اصلاح بیومکانیک، جایگزینی ایمن و ریکاوری بافت‌های درگیر قرار گرفت.';
  } else if (avgFatigue >= 8.5 || failureRate >= 40) {
    overallStrategy = 'Deload';
    strategyReasonFa = 'خستگی تجمعی بالا و افت توان عضلانی ثبت شده است. کاهش ۳۰٪ حجم تمرین جهت سوپرکامپنسیشن اعمال می‌شود.';
  } else if (avgRpe >= 8.5 || weekCompletionRate < 0.6) {
    overallStrategy = 'Consolidation';
    strategyReasonFa = 'حجم و شدت فعلی برای تطبیق ساختاری مناسب است؛ تثبیت بار برای تقویت کنترل فرم و پیشگیری از بیش‌تمرینی.';
  } else {
    overallStrategy = 'Progression';
    strategyReasonFa = 'عملکرد عالی و ریکاوری بهینه؛ سیستم با اعمال اضافه بار تدریجی (Progressive Overload) و شوک ملایم پیش می‌رود.';
  }

  const adherenceScore = Math.min(100, Math.round(weekCompletionRate * 80 + (avgRpe <= 8 ? 20 : 10)));

  return {
    week_number: weekNumber,
    total_sessions_scheduled: totalScheduled,
    total_sessions_completed: activeCompletedCount,
    week_completion_rate: weekCompletionRate,
    is_week_completed: isWeekCompleted,
    average_rpe: avgRpe,
    average_fatigue: avgFatigue,
    failure_rate: failureRate,
    has_pain_flag: painFlags.length > 0,
    pain_locations: Array.from(new Set(painFlags)),
    adherence_score: adherenceScore,
    recovery_status: recoveryStatus,
    overall_strategy_decision: overallStrategy,
    strategy_reason_fa: strategyReasonFa,
    strong_areas_fa: strongAreas.length > 0 ? strongAreas.slice(0, 3) : ['اجرای منظم جلسات و تعهد به برنامه'],
    weak_areas_fa: weakAreas.length > 0 ? weakAreas.slice(0, 3) : ['نیاز به افزایش استقامت در ست‌های پایانی'],
    exercise_metrics: exerciseMetrics,
    generated_at: new Date().toISOString()
  };
}

// =========================================================================
// 2. WEEK UNLOCK STATUS CHECKER
// =========================================================================

export function getWeeklyUnlockStatuses(
  program: WorkoutProgram,
  logs: WorkoutLog[]
): Record<number, WeeklyUnlockStatus> {
  const result: Record<number, WeeklyUnlockStatus> = {};
  const activeDaysCount = program.days.filter(d => !d.is_rest_day).length;

  // 1. Week 1 is always unlocked
  const w1Logs = getLogsForWeek(logs, program.id, 1);
  const w1CompletedDays = new Set(w1Logs.map(l => l.day_number)).size;
  const w1Rate = activeDaysCount > 0 
    ? Math.min(100, Math.round((w1CompletedDays / activeDaysCount) * 100)) 
    : 0;
  const w1IsDone = w1Rate >= WEEK_COMPLETION_THRESHOLD_PERCENT;
  const w2Generated = !!(program.weeks_map && program.weeks_map[2]);

  result[1] = {
    week_number: 1,
    is_unlocked: true,
    is_completed: w1IsDone,
    completion_rate_percent: w1Rate,
    unlock_requirement_fa: 'برنامه پایه هفته اول فعال است.',
    can_generate_next: w1IsDone && !w2Generated
  };

  // 2. Week 2: Unlocks ONLY when Week 1 is completed (>=70%) or already generated in weeks_map
  const w2Unlocked = w1IsDone || w2Generated;
  const w2Logs = getLogsForWeek(logs, program.id, 2);
  const w2CompletedDays = new Set(w2Logs.map(l => l.day_number)).size;
  const w2Rate = (w2Unlocked && w2Generated && activeDaysCount > 0)
    ? Math.min(100, Math.round((w2CompletedDays / activeDaysCount) * 100))
    : 0;
  const w2IsDone = w2Rate >= WEEK_COMPLETION_THRESHOLD_PERCENT;
  const w3Generated = !!(program.weeks_map && program.weeks_map[3]);

  result[2] = {
    week_number: 2,
    is_unlocked: w2Unlocked,
    is_completed: w2IsDone,
    completion_rate_percent: w2Rate,
    unlock_requirement_fa: 'تکمیل حداقل ۷۰٪ جلسات تمرینی هفته ۱',
    can_generate_next: w2IsDone && !w3Generated
  };

  // 3. Week 3: Unlocks ONLY when Week 2 is completed (>=70%) or already generated in weeks_map
  const w3Unlocked = w2IsDone || w3Generated;
  const w3Logs = getLogsForWeek(logs, program.id, 3);
  const w3CompletedDays = new Set(w3Logs.map(l => l.day_number)).size;
  const w3Rate = (w3Unlocked && w3Generated && activeDaysCount > 0)
    ? Math.min(100, Math.round((w3CompletedDays / activeDaysCount) * 100))
    : 0;
  const w3IsDone = w3Rate >= WEEK_COMPLETION_THRESHOLD_PERCENT;
  const w4Generated = !!(program.weeks_map && program.weeks_map[4]);

  result[3] = {
    week_number: 3,
    is_unlocked: w3Unlocked,
    is_completed: w3IsDone,
    completion_rate_percent: w3Rate,
    unlock_requirement_fa: 'تکمیل حداقل ۷۰٪ جلسات تمرینی هفته ۲',
    can_generate_next: w3IsDone && !w4Generated
  };

  // 4. Week 4: Unlocks ONLY when Week 3 is completed (>=70%) or already generated in weeks_map
  const w4Unlocked = w3IsDone || w4Generated;
  const w4Logs = getLogsForWeek(logs, program.id, 4);
  const w4CompletedDays = new Set(w4Logs.map(l => l.day_number)).size;
  const w4Rate = (w4Unlocked && w4Generated && activeDaysCount > 0)
    ? Math.min(100, Math.round((w4CompletedDays / activeDaysCount) * 100))
    : 0;
  const w4IsDone = w4Rate >= WEEK_COMPLETION_THRESHOLD_PERCENT;

  result[4] = {
    week_number: 4,
    is_unlocked: w4Unlocked,
    is_completed: w4IsDone,
    completion_rate_percent: w4Rate,
    unlock_requirement_fa: 'تکمیل حداقل ۷۰٪ جلسات تمرینی هفته ۳',
    can_generate_next: false
  };

  return result;
}
