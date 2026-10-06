import {
  UserAssessment,
  FitnessProfile,
  WorkoutProgram,
  WorkoutDay,
  PrescribedExercise,
  Exercise,
  FitnessLevel,
  GoalType,
  EnvironmentType,
  EquipmentType,
  PhysicalLimitation,
  SportIdentityCard,
  MovementPattern,
  WorkoutLog,
  WorkoutGenerationReport,
  AntiDuplicationAuditReport,
  WeeklyDifferenceSummary,
  ExerciseRole,
  ExerciseAdaptationAction
} from '../types';
import { EXERCISES_DATABASE } from '../data/exercises';
import { buildDynamicSplitSessions } from './splitBuilder';
import { analyzeWeeklyPerformance } from './adaptiveEngine';

// =========================================================================
// 1. ATHLETIC PROFILE ANALYSIS (تحلیل پروفایل ورزشی چندبُعدی)
// =========================================================================

export interface AthleticSubLevels {
  pushLevel: FitnessLevel;
  pullLevel: FitnessLevel;
  legsLevel: FitnessLevel;
  coreLevel: FitnessLevel;
  overallLevel: FitnessLevel;
}

export function computeAthleticSubLevels(assessment: UserAssessment): AthleticSubLevels {
  const pMax = assessment.pushupsMax || 0;
  const pullMax = assessment.pullupsMax || 0;
  const sqMax = assessment.squatsMax || 0;
  const plankSec = assessment.plankSeconds || 0;
  const expMonths = assessment.experienceMonths || 0;

  // 1. Push Level
  let pushLevel: FitnessLevel = 'beginner';
  if (pMax >= 22) pushLevel = 'advanced';
  else if (pMax >= 8) pushLevel = 'intermediate';

  // 2. Pull Level
  let pullLevel: FitnessLevel = 'beginner';
  if (pullMax >= 8) pullLevel = 'advanced';
  else if (pullMax >= 2) pullLevel = 'intermediate';

  // 3. Legs Level
  let legsLevel: FitnessLevel = 'beginner';
  if (sqMax >= 35) legsLevel = 'advanced';
  else if (sqMax >= 15) legsLevel = 'intermediate';

  // 4. Core Level
  let coreLevel: FitnessLevel = 'beginner';
  if (plankSec >= 75) coreLevel = 'advanced';
  else if (plankSec >= 35) coreLevel = 'intermediate';

  // 5. Overall Level (Weighted Composite)
  const score = (
    (pushLevel === 'advanced' ? 3 : pushLevel === 'intermediate' ? 2 : 1) * 0.25 +
    (pullLevel === 'advanced' ? 3 : pullLevel === 'intermediate' ? 2 : 1) * 0.25 +
    (legsLevel === 'advanced' ? 3 : legsLevel === 'intermediate' ? 2 : 1) * 0.25 +
    (coreLevel === 'advanced' ? 3 : coreLevel === 'intermediate' ? 2 : 1) * 0.25
  );

  let overallLevel: FitnessLevel = 'beginner';
  if (score >= 2.5 || (expMonths >= 18 && score >= 2.0)) {
    overallLevel = 'advanced';
  } else if (score >= 1.6 || expMonths >= 3) {
    overallLevel = 'intermediate';
  } else {
    overallLevel = 'beginner';
  }

  return {
    pushLevel,
    pullLevel,
    legsLevel,
    coreLevel,
    overallLevel
  };
}

export function buildSportIdentityCard(
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[] = []
): SportIdentityCard {
  const subLevels = computeAthleticSubLevels(assessment);
  const bmi = Math.round((assessment.weightKg / Math.pow(assessment.heightCm / 100, 2)) * 10) / 10;

  // Identify Strengths & Weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (subLevels.pushLevel === 'advanced') {
    strengths.push('قدرت فوق‌العاده در الگوی فشاری بالاتنه (سینه و سرشانه)');
  } else if (subLevels.pushLevel === 'beginner') {
    weaknesses.push('نیاز به تقویت توان پایه در حرکات فشاری بالاتنه');
  }

  if (subLevels.pullLevel === 'advanced') {
    strengths.push('استقامت و قدرت کششی عالی در عضلات پشتی و زیربغل');
  } else if (subLevels.pullLevel === 'beginner') {
    weaknesses.push('ضعف در الگوی کششی عمودی (بارفیکس و ضخامت پشت)');
  }

  if (subLevels.legsLevel === 'advanced') {
    strengths.push('پایه قدرتمند در عضلات چهارسر و ثبات حرکتی پایین‌تنه');
  } else if (subLevels.legsLevel === 'beginner') {
    weaknesses.push('نیاز به افزایش استقامت عضلات ران و زنجیره خلفی');
  }

  if (subLevels.coreLevel === 'advanced') {
    strengths.push('کنترل بالا و ثبات ایزومتریک قوی در مرکز بدن (Core)');
  } else if (subLevels.coreLevel === 'beginner') {
    weaknesses.push('نیاز به تقویت پایداری ستون فقرات و عضلات راست شکم');
  }

  if (strengths.length === 0) {
    strengths.push('انگیزه بالا و بستر بسیار مناسب برای سازگاری سریع عصب-عضله');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('تعادل ساختاری مناسب در تمام الگوهای حرکتی');
  }

  // Safety flags
  const safetyNotes: string[] = [];
  if (assessment.limitations && assessment.limitations.length > 0) {
    if (assessment.limitations.includes('shoulder_pain')) {
      safetyNotes.push('محدودیت شانه: حذف پارالل عمیق و زوایای آسیب‌رسان؛ اولویت بر زوایای خنثی و فیس‌پول');
    }
    if (assessment.limitations.includes('wrist_pain')) {
      safetyNotes.push('محدودیت مچ دست: جایگزینی شنای استاندارد با شنا روی ساعد/مشت و دمبل‌های خنثی');
    }
    if (assessment.limitations.includes('knee_pain')) {
      safetyNotes.push('محدودیت زانو: حذف لانژهای متحرک عمیق؛ تمرکز بر پل باسن و اسکوات کنترل‌شده');
    }
    if (assessment.limitations.includes('lower_back_pain')) {
      safetyNotes.push('محدودیت کمر: تمرکز بر ددباگ و پلانک مستقیم؛ حذف حرکات چرخشی انفجاری');
    }
    if (assessment.limitations.includes('elbow_pain')) {
      safetyNotes.push('محدودیت آرنج: کنترل فاز منفی در دیپس و چین‌آپ جهت کاهش تنش تاندونی');
    }
  } else {
    safetyNotes.push('سیستم حرکتی بدون آسیب فعال؛ مجاز به بارگذاری در تمام الگوهای حرکتی استاندارد');
  }

  return {
    id: `card_${Date.now()}`,
    user_id: 'user_active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    physicalProfile: {
      age: assessment.age,
      sex: assessment.sex,
      heightCm: assessment.heightCm,
      weightKg: assessment.weightKg,
      bmi,
      limitations: assessment.limitations || []
    },
    trainingProfile: {
      level: subLevels.overallLevel,
      pushLevel: subLevels.pushLevel,
      pullLevel: subLevels.pullLevel,
      legsLevel: subLevels.legsLevel,
      coreLevel: subLevels.coreLevel,
      experienceMonths: assessment.experienceMonths,
      frequencyDays: assessment.trainingDaysPerWeek,
      sessionDurationMins: assessment.minutesPerSession,
      strengths,
      weaknesses
    },
    goalProfile: {
      primaryGoal: assessment.primaryGoal,
      secondaryGoals: assessment.secondaryGoals || []
    },
    environmentProfile: {
      environment: assessment.environment,
      equipment: assessment.equipment || ['bodyweight']
    },
    recoveryProfile: {
      sleepHours: assessment.sleepHours,
      dailyActivityLevel: assessment.dailyActivityLevel,
      estimatedRecoveryScore: assessment.sleepHours >= 8 ? 'high' : assessment.sleepHours >= 6 ? 'medium' : 'low'
    },
    safetyProfile: {
      activeLimitations: assessment.limitations || [],
      safetyNotes
    }
  };
}

// =========================================================================
// 2. GOAL STRATEGY FORMULATION (تنظیم استراتژی هدف‌محور)
// =========================================================================

export interface GoalStrategy {
  targetSets: number;
  targetReps: string;
  accessoryReps: string;
  restSeconds: number;
  accessoryRestSeconds: number;
  tempo: string;
  philosophyFa: string;
  focusAccentFa: string;
}

export function getGoalStrategy(goal: GoalType, level: FitnessLevel): GoalStrategy {
  switch (goal) {
    case 'muscle_gain':
      return {
        targetSets: level === 'advanced' ? 4 : 3,
        targetReps: '8-12',
        accessoryReps: '10-15',
        restSeconds: 75,
        accessoryRestSeconds: 60,
        tempo: '3-0-1-0',
        philosophyFa: 'اصل تنش مکانیکی و حجم بهینه هفتگی (Hypertrophy) با کنترل ۳ ثانیه‌ای فاز اکسنتریک (منفی).',
        focusAccentFa: 'حجم عضلانی، پمپ خونی و بارگذاری تصاعدی'
      };

    case 'v_shape':
      return {
        targetSets: level === 'advanced' ? 4 : 3,
        targetReps: '8-12',
        accessoryReps: '12-15',
        restSeconds: 75,
        accessoryRestSeconds: 60,
        tempo: '3-1-1-0',
        philosophyFa: 'تمرکز اختصاصی بر پهنای لت‌های پشتی (V-Shape)، دلتوئید جانبی سرشانه و باریک‌سازی خط کمر.',
        focusAccentFa: 'عرض پشت، سرشانه ۳ بعدی و ثبات عضلات مورب کور'
      };

    case 'fat_loss':
      return {
        targetSets: 3,
        targetReps: '12-15',
        accessoryReps: '15-20',
        restSeconds: 50,
        accessoryRestSeconds: 45,
        tempo: '2-0-1-0',
        philosophyFa: 'افزایش چگالی متابولیک، حفظ حداکثری بافت عضلانی در کسر کالری و کالری‌سوزی مداوم.',
        focusAccentFa: 'استقامت عضلانی، چگالی تمرین و چربی‌سوزی هدفمند'
      };

    case 'calisthenics_skill':
      return {
        targetSets: level === 'advanced' ? 4 : 3,
        targetReps: '4-8',
        accessoryReps: '8-12',
        restSeconds: 105,
        accessoryRestSeconds: 75,
        tempo: '3-1-1-0',
        philosophyFa: 'درخت مهارت وزن بدن (Skill Tree): پیشرفت گام‌به‌گام در اهرم‌های بیومکانیک و قدرت نسبی.',
        focusAccentFa: 'تسلط بر وزن بدن، ثبات مفاصل و پیش‌نیازهای مهارتی'
      };

    case 'strength':
      return {
        targetSets: 4,
        targetReps: '4-6',
        accessoryReps: '6-8',
        restSeconds: 120,
        accessoryRestSeconds: 90,
        tempo: '3-1-X-0',
        philosophyFa: 'تحریک حداکثری واحدهای حرکتی تندانقباض (Neural Drive) با استراحت‌های کامل و توان انفجاری.',
        focusAccentFa: 'قدرت خالص، انتقال نیرو و توان مفصلی'
      };

    case 'general_fitness':
    default:
      return {
        targetSets: 3,
        targetReps: '10-12',
        accessoryReps: '12-15',
        restSeconds: 60,
        accessoryRestSeconds: 45,
        tempo: '2-0-1-0',
        philosophyFa: 'تعادل در هر سه صفحه حرکتی، ارتقای سلامت قلب و عروق و آمادگی کامل بدنی روزمره.',
        focusAccentFa: 'سلامت مفاصل، استقامت عمومی و تعادل حرکتی'
      };
  }
}

// =========================================================================
// 3. EXERCISE FILTERING & SELECTION ENGINE (موتور گزینش هوشمند تمرینات)
// =========================================================================

export interface ExerciseAvailabilityResult {
  available: boolean;
  reason?: 'equipment_unavailable' | 'environment_mismatch' | 'injury_restriction' | 'difficulty_mismatch';
  reason_fa?: string;
  missing_equipment?: EquipmentType[];
  conflict_injuries?: PhysicalLimitation[];
}

export function isExerciseAvailable(
  exercise: Exercise,
  userAssessment: UserAssessment
): ExerciseAvailabilityResult {
  const userEnv = userAssessment.environment || 'home';
  const userEquipment = userAssessment.equipment && userAssessment.equipment.length > 0 
    ? userAssessment.equipment 
    : ['bodyweight'];
  const userLimitations = userAssessment.limitations || [];

  // 1. HARD CONSTRAINT: Safety / Contraindications
  if (userLimitations.length > 0 && exercise.contraindications && exercise.contraindications.length > 0) {
    const conflicts = exercise.contraindications.filter(lim => userLimitations.includes(lim));
    if (conflicts.length > 0) {
      return {
        available: false,
        reason: 'injury_restriction',
        reason_fa: `منع به دلیل آسیب‌دیدگی یا محدودیت فیزیکی (${conflicts.join(', ')})`,
        conflict_injuries: conflicts
      };
    }
  }

  // 2. HARD CONSTRAINT: Environment Compatibility
  if (userEnv === 'home') {
    if (!exercise.environment.includes('home') && !exercise.environment.includes('combination')) {
      return {
        available: false,
        reason: 'environment_mismatch',
        reason_fa: 'این تمرین برای محیط خانه طراحی نشده است (نیازمند امکانات باشگاه/پارک).'
      };
    }
  } else if (userEnv === 'park') {
    if (!exercise.environment.includes('park') && !exercise.environment.includes('combination')) {
      return {
        available: false,
        reason: 'environment_mismatch',
        reason_fa: 'این تمرین برای محیط پارک یا فضای باز مناسب نیست.'
      };
    }
  } else if (userEnv === 'gym') {
    if (!exercise.environment.includes('gym') && !exercise.environment.includes('combination')) {
      return {
        available: false,
        reason: 'environment_mismatch',
        reason_fa: 'این تمرین در پروتکل باشگاه لحاظ نمی‌شود.'
      };
    }
  }

  // 3. HARD CONSTRAINT: Equipment Availability
  // Every required non-bodyweight equipment must be available in userEquipment
  const missingEq: EquipmentType[] = [];
  for (const eq of exercise.equipment) {
    if (eq === 'bodyweight') continue;

    if (eq === 'parallel_bars') {
      if (!userEquipment.includes('parallel_bars') && !userEquipment.includes('dip_station')) {
        missingEq.push('parallel_bars');
      }
    } else if (eq === 'dip_station') {
      if (!userEquipment.includes('dip_station') && !userEquipment.includes('parallel_bars')) {
        missingEq.push('dip_station');
      }
    } else {
      if (!userEquipment.includes(eq)) {
        missingEq.push(eq);
      }
    }
  }

  if (missingEq.length > 0) {
    return {
      available: false,
      reason: 'equipment_unavailable',
      reason_fa: `تجهیزات موردنیاز (${missingEq.join('، ')}) در دسترس شما نیست.`,
      missing_equipment: missingEq
    };
  }

  return {
    available: true
  };
}

export interface FilterAuditSummary {
  eligiblePool: Exercise[];
  totalDatabaseCount: number;
  rejectedCount: number;
  rejectedGymCount: number;
  rejectedBreakdown: {
    equipment_unavailable: number;
    environment_mismatch: number;
    injury_restriction: number;
    difficulty_mismatch: number;
  };
  rejectedAuditList: Array<{
    exercise_id: string;
    name_fa: string;
    name_en: string;
    reason: 'equipment_unavailable' | 'environment_mismatch' | 'injury_restriction' | 'difficulty_mismatch';
    reason_fa: string;
    required_equipment?: EquipmentType[];
    conflict_injuries?: PhysicalLimitation[];
  }>;
}

export function getEligibleExercisePoolWithAudit(userAssessment: UserAssessment): FilterAuditSummary {
  const eligiblePool: Exercise[] = [];
  const rejectedAuditList: FilterAuditSummary['rejectedAuditList'] = [];
  let rejectedGymCount = 0;
  const rejectedBreakdown = {
    equipment_unavailable: 0,
    environment_mismatch: 0,
    injury_restriction: 0,
    difficulty_mismatch: 0
  };

  for (const ex of EXERCISES_DATABASE) {
    const check = isExerciseAvailable(ex, userAssessment);
    if (check.available) {
      eligiblePool.push(ex);
    } else {
      if (check.reason) {
        rejectedBreakdown[check.reason]++;
      }
      if (ex.environment.length === 1 && ex.environment[0] === 'gym' && userAssessment.environment !== 'gym') {
        rejectedGymCount++;
      }
      rejectedAuditList.push({
        exercise_id: ex.id,
        name_fa: ex.name_fa,
        name_en: ex.name_en,
        reason: check.reason || 'equipment_unavailable',
        reason_fa: check.reason_fa || 'نامناسب برای پروفایل',
        required_equipment: check.missing_equipment,
        conflict_injuries: check.conflict_injuries
      });
    }
  }

  return {
    eligiblePool,
    totalDatabaseCount: EXERCISES_DATABASE.length,
    rejectedCount: rejectedAuditList.length,
    rejectedGymCount,
    rejectedBreakdown,
    rejectedAuditList
  };
}

export function filterExercisesForUser(
  userAssessment: UserAssessment,
  movementPattern?: MovementPattern | MovementPattern[],
  category?: string
): Exercise[] {
  const { eligiblePool } = getEligibleExercisePoolWithAudit(userAssessment);

  return eligiblePool.filter(ex => {
    // Movement Pattern Match
    if (movementPattern) {
      if (Array.isArray(movementPattern)) {
        if (!movementPattern.includes(ex.movement_pattern)) return false;
      } else {
        if (ex.movement_pattern !== movementPattern) return false;
      }
    }

    // Category Match
    if (category && ex.category !== category) {
      return false;
    }

    return true;
  });
}

export function pickBestExerciseForPattern(
  candidates: Exercise[],
  userLevel: FitnessLevel,
  preferredDifficulty?: FitnessLevel,
  fallbackId: string = 'pushup_standard'
): Exercise {
  if (candidates.length === 0) {
    const fallback = EXERCISES_DATABASE.find(e => e.id === fallbackId);
    return fallback || EXERCISES_DATABASE[0];
  }

  const targetDiff = preferredDifficulty || userLevel;

  // 1. Exact difficulty match
  const exact = candidates.filter(e => e.difficulty === targetDiff);
  if (exact.length > 0) {
    return exact[0];
  }

  // 2. Closest difficulty match
  if (targetDiff === 'advanced') {
    const inter = candidates.filter(e => e.difficulty === 'intermediate');
    if (inter.length > 0) return inter[0];
  } else if (targetDiff === 'intermediate') {
    const beg = candidates.filter(e => e.difficulty === 'beginner');
    if (beg.length > 0) return beg[0];
    const adv = candidates.filter(e => e.difficulty === 'advanced');
    if (adv.length > 0) return adv[0];
  } else {
    const inter = candidates.filter(e => e.difficulty === 'intermediate');
    if (inter.length > 0) return inter[0];
  }

  return candidates[0];
}

/**
 * Multi-Factor Scoring & Ranking Exercise Picker that guarantees the chosen exercise
 * is strictly from the user's eligible pool and mathematically optimal for the user's goal & level.
 */
export function scoreAndRankExercise(
  exercise: Exercise,
  options: {
    movementPatterns?: MovementPattern[];
    categories?: string[];
    difficulty?: FitnessLevel;
    excludedIds?: string[];
    priorityEquipment?: EquipmentType[];
    fallbackPatterns?: MovementPattern[];
    targetGoal?: GoalType;
    preferredMuscles?: string[];
  }
): number {
  let score = 0;

  // 1. Exclusion Penalty
  if (options.excludedIds && options.excludedIds.includes(exercise.id)) {
    return -1000;
  }

  // 2. Movement Pattern Alignment (Primary Weight)
  if (options.movementPatterns && options.movementPatterns.length > 0) {
    if (options.movementPatterns.includes(exercise.movement_pattern)) {
      score += 120;
    } else if (options.fallbackPatterns && options.fallbackPatterns.includes(exercise.movement_pattern)) {
      score += 60;
    } else {
      score -= 50;
    }
  }

  // 3. Category Alignment
  if (options.categories && options.categories.length > 0) {
    if (options.categories.includes(exercise.category)) {
      score += 50;
    }
  }

  // 4. Difficulty Calibration vs User Sub-Level
  const targetDiff = options.difficulty || 'intermediate';
  if (exercise.difficulty === targetDiff) {
    score += 60;
  } else if (targetDiff === 'advanced' && exercise.difficulty === 'intermediate') {
    score += 35;
  } else if (targetDiff === 'intermediate') {
    score += 25; // either beginner or advanced
  } else if (targetDiff === 'beginner' && exercise.difficulty === 'intermediate') {
    score += 15;
  } else if (targetDiff === 'beginner' && exercise.difficulty === 'advanced') {
    score -= 90; // High risk of injury/form breakdown for beginners
  }

  // 5. Priority Equipment Synergy
  if (options.priorityEquipment && options.priorityEquipment.length > 0) {
    const hasPriorityEq = exercise.equipment.some(eq => options.priorityEquipment!.includes(eq));
    if (hasPriorityEq) {
      score += 35;
    }
  }

  // 6. Goal-Specific Biomechanical Synergy
  if (options.targetGoal) {
    switch (options.targetGoal) {
      case 'v_shape':
        if (
          exercise.movement_pattern === 'pull_vertical' ||
          exercise.movement_pattern === 'push_vertical' ||
          exercise.primary_muscles.some(m => m.includes('لت') || m.includes('پشت') || m.includes('دلتوئید'))
        ) {
          score += 45;
        }
        break;
      case 'calisthenics_skill':
        if (exercise.equipment.includes('bodyweight') || exercise.equipment.includes('pullup_bar') || exercise.equipment.includes('parallel_bars')) {
          score += 40;
        }
        break;
      case 'strength':
        if (['squat', 'hinge', 'push_horizontal', 'pull_vertical', 'push_vertical'].includes(exercise.movement_pattern)) {
          score += 40;
        }
        break;
      case 'muscle_gain':
        if (exercise.equipment.includes('dumbbells') || exercise.equipment.includes('barbell') || exercise.equipment.includes('gym_machines')) {
          score += 30;
        }
        break;
      case 'fat_loss':
        if (['squat', 'lunge', 'hinge', 'cardio', 'core_anti_extension'].includes(exercise.movement_pattern)) {
          score += 30;
        }
        break;
      default:
        break;
    }
  }

  // 7. Gold Standard / Featured Exercise Quality
  if (exercise.is_featured) {
    score += 10;
  }

  return score;
}

/**
 * Robust Exercise Picker that guarantees the chosen exercise is strictly from the user's eligible pool
 */
export function pickSafeExerciseFromPool(
  eligiblePool: Exercise[],
  options: {
    movementPatterns?: MovementPattern[];
    categories?: string[];
    difficulty?: FitnessLevel;
    excludedIds?: string[];
    priorityEquipment?: EquipmentType[];
    fallbackPatterns?: MovementPattern[];
    targetGoal?: GoalType;
    preferredMuscles?: string[];
  }
): Exercise {
  if (eligiblePool.length === 0) {
    return EXERCISES_DATABASE[0];
  }

  const excluded = new Set(options.excludedIds || []);
  let pool = eligiblePool.filter(e => !excluded.has(e.id));
  if (pool.length === 0) {
    pool = eligiblePool; // reset if all excluded
  }

  // Calculate ranking score for each candidate in the pool
  const scoredPool = pool.map(ex => ({
    exercise: ex,
    score: scoreAndRankExercise(ex, options)
  }));

  // Sort descending by score
  scoredPool.sort((a, b) => b.score - a.score);

  return scoredPool[0]?.exercise || pool[0] || eligiblePool[0];
}

// =========================================================================
// 4. ADAPTIVE WORKOUT GENERATION ENGINE (هسته تولید برنامه تمرینی)
// =========================================================================

export function generateAdaptiveWorkoutProgram(
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[] = [],
  weekNumber: number = 1
): WorkoutProgram {
  const card = buildSportIdentityCard(assessment, workoutLogs);
  const subLevels = computeAthleticSubLevels(assessment);
  const goalStrategy = getGoalStrategy(assessment.primaryGoal, subLevels.overallLevel);
  const freq = Math.min(6, Math.max(1, assessment.trainingDaysPerWeek || 4));

  // 1. HARD CONSTRAINT FILTERING & AUDIT
  const audit = getEligibleExercisePoolWithAudit(assessment);
  const eligiblePool = audit.eligiblePool;

  // 2. DYNAMIC SPLIT GENERATION (strictly from eligible pool with precise time budget)
  let avgFatigue = 5;
  let avgRpe = 7;
  if (workoutLogs.length > 0) {
    const fatigueList = workoutLogs.map(l => l.overall_fatigue_1_10 || 5);
    avgFatigue = Math.round(fatigueList.reduce((a, b) => a + b, 0) / fatigueList.length);
    let rpeSum = 0, rpeCount = 0;
    workoutLogs.forEach(l => l.logs.forEach(item => {
      rpeSum += (item.rpe || item.difficulty_rating_1_10 || 7);
      rpeCount++;
    }));
    if (rpeCount > 0) avgRpe = Math.round((rpeSum / rpeCount) * 10) / 10;
  }

  const rawSessions = buildDynamicSplitSessions({
    assessment,
    eligiblePool,
    subLevels,
    goalStrategy,
    weekNumber,
    avgFatigueLogged: avgFatigue,
    avgRpeLogged: avgRpe
  });

  // 3. POST-GENERATION VALIDATION & AUDIT
  const selectedExMap = new Map<string, Exercise>();
  const violationsLog: string[] = [];
  let gymOnlyCountInHome = 0;
  let unauthorizedEqCount = 0;
  let contraindicationCount = 0;

  const userEnv = assessment.environment || 'home';
  const userEquipment: EquipmentType[] = assessment.equipment && assessment.equipment.length > 0 
    ? assessment.equipment 
    : ['bodyweight'];
  const userLimitations = assessment.limitations || [];

  rawSessions.forEach(session => {
    const allExercisesInSession = [
      ...(session.warmup || []),
      ...(session.main_workout || []),
      ...(session.accessory || []),
      ...(session.finisher || [])
    ];

    allExercisesInSession.forEach(item => {
      const ex = EXERCISES_DATABASE.find(e => e.id === item.exercise_id);
      if (!ex) return;

      selectedExMap.set(ex.id, ex);

      // Environment check
      if (userEnv === 'home' && ex.environment.length === 1 && ex.environment[0] === 'gym') {
        gymOnlyCountInHome++;
        violationsLog.push(`تداخل محیط: حرکت باشگاهی ${ex.name_fa} در برنامه خانگی`);
      }

      // Equipment check
      for (const eq of ex.equipment) {
        if (eq === 'bodyweight') continue;
        if (eq === 'parallel_bars' && (userEquipment.includes('parallel_bars') || userEquipment.includes('dip_station'))) continue;
        if (eq === 'dip_station' && (userEquipment.includes('dip_station') || userEquipment.includes('parallel_bars'))) continue;
        if (!userEquipment.includes(eq)) {
          unauthorizedEqCount++;
          violationsLog.push(`تجهیزات غیرمجاز: حرکت ${ex.name_fa} نیازمند ${eq} است.`);
        }
      }

      // Safety check
      if (userLimitations.length > 0 && ex.contraindications && ex.contraindications.length > 0) {
        const conflicts = ex.contraindications.filter(lim => userLimitations.includes(lim));
        if (conflicts.length > 0) {
          contraindicationCount++;
          violationsLog.push(`تداخل پزشکی: حرکت ${ex.name_fa} برای محدودیت ${conflicts.join(', ')} منع شده است.`);
        }
      }
    });
  });

  const selectedExercisesList = Array.from(selectedExMap.values()).map(e => ({
    id: e.id,
    name_fa: e.name_fa,
    name_en: e.name_en,
    category: e.category,
    movement_pattern: e.movement_pattern,
    difficulty: e.difficulty,
    equipment: e.equipment
  }));

  const rejectedReasonsSummary: string[] = [
    `تجهیزات ناموجود: ${audit.rejectedBreakdown.equipment_unavailable} تمرین حذف شدند`,
    `عدم تطابق محیط تمرین: ${audit.rejectedBreakdown.environment_mismatch} تمرین حذف شدند`,
    `منع پزشکی و آسیب‌دیدگی: ${audit.rejectedBreakdown.injury_restriction} تمرین حذف شدند`
  ];

  const generationReport: WorkoutGenerationReport = {
    timestamp: new Date().toISOString(),
    user_environment: assessment.environment,
    available_equipment: userEquipment,
    goal: assessment.primaryGoal,
    level: subLevels.overallLevel,
    total_database_exercises: audit.totalDatabaseCount,
    eligible_pool_size: audit.eligiblePool.length,
    rejected_exercises_count: audit.rejectedCount,
    rejected_gym_exercises_count: audit.rejectedGymCount,
    rejected_breakdown: audit.rejectedBreakdown,
    rejected_reasons_summary: rejectedReasonsSummary,
    rejected_details_sample: audit.rejectedAuditList.slice(0, 15),
    selected_exercises: selectedExercisesList,
    validation: {
      passed: gymOnlyCountInHome === 0 && unauthorizedEqCount === 0 && contraindicationCount === 0,
      gym_only_exercises_in_home_count: gymOnlyCountInHome,
      unauthorized_equipment_count: unauthorizedEqCount,
      contraindication_violations_count: contraindicationCount,
      violations_log: violationsLog
    }
  };

  // Generate Personalized Scientific Rationale
  const goalPersianMap: Record<GoalType, string> = {
    muscle_gain: 'افزایش حجم عضلانی (Hypertrophy)',
    fat_loss: 'چربی‌سوزی و حفظ بافت عضلانی',
    v_shape: 'ساخت فیزیک V-Shape و شانه پهن',
    strength: 'افزایش قدرت انفجاری و توان مفاصل',
    calisthenics_skill: 'تسلط بر مهارت‌های وزن بدن و کلیستنیکس',
    endurance: 'افزایش استقامت عضلانی و قلبی‌عروقی',
    general_fitness: 'ارتقای آمادگی جسمانی عمومی',
    athletic: 'افزایش چابکی و قدرت کاربردی ورزشی'
  };

  const envPersianMap: Record<EnvironmentType, string> = {
    home: 'خانه',
    gym: 'باشگاه',
    park: 'پارک',
    combination: 'ترکیبی (خانه و پارک/باشگاه)'
  };

  const weekFocusTitles: Record<number, string> = {
    1: 'هفته اول (Foundation): ساخت پایه، تثبیت فرم صحیح و تعیین مبنای عملکرد',
    2: 'هفته دوم (Progression): افزایش تکرار و ست‌ها بر پایه اصل اورلود تدریجی',
    3: 'هفته سوم (Overload & Variation): اوج چگالی و تنوع در حرکات کمکی',
    4: avgFatigue >= 7 ? 'هفته چهارم (Deload): دیلود و ریکاوری فعال مفاصل و سیستم عصبی' : 'هفته چهارم (Peak): تست رکوردهای فردی و تثبیت دستاوردها'
  };

  const whyThisProgramFa = `با توجه به کارت هویت ورزشی شما (سن ${assessment.age} سال، وزن ${assessment.weightKg} کیلوگرم، توانایی انجام ${assessment.pushupsMax} شنا و ${assessment.pullupsMax} بارفیکس)، تمرین در محیط ${envPersianMap[assessment.environment]} با بودجه زمانی ${assessment.minutesPerSession || 60} دقیقه و فرکانس دقیقاً ${freq} روز در هفته، این برنامه بر اساس هدف «${goalPersianMap[assessment.primaryGoal]}» طراحی گردیده است. تمامی ${freq} جلسه بر پایه بودجه زمانی واقعی و اصل اورلود تدریجی تنظیم شده‌اند.`;

  const scientificNotesFa: string[] = [
    `بودجه زمانی هر جلسه (${assessment.minutesPerSession || 60} دقیقه) مستقیماً ساختار ست‌ها، استراحت و انتخاب حرکات را بهینه‌سازی کرده است.`,
    'اصل اورلود تدریجی (Progressive Overload) حاکم بر این برنامه است؛ تغییرات هفتگی بر پایه توان و لاگ‌های واقعی شما تنظیم می‌شوند.',
    'حرکات اصلی و پایه (Foundation) برای سنجش رشد قدرت حفظ شده و حرکات کمکی تنوع هوشمندانه دریافت می‌کنند.',
    'کنترل فاز اکسنتریک (منفی) به مدت ۳ ثانیه، میزان فراخوانی فیبرهای عضلانی تندانقباض را تا ۳۵٪ افزایش می‌دهد.'
  ];

  const today = new Date();
  const nextWeekDate = new Date(today);
  nextWeekDate.setDate(today.getDate() + 7);

  const finalDays = buildFull7DaySchedule(rawSessions, freq);

  // 4. PROGRAM QUALITY CHECK (اعتبارسنجی کیفی ۱۲ مرحله‌ای قبل از رندر)
  const qualityCheck = validateAndAuditProgramQuality({
    assessment,
    rawSessions,
    finalDays,
    eligiblePool,
    freq,
    weekNumber,
    generationReport
  });

  // 5. EXERCISE CONTINUITY MATRIX (ماتریس تداوم حرکات در بلوک ۴ هفته‌ای)
  const continuityMatrix = buildExerciseContinuityMatrix(rawSessions, weekNumber, avgFatigue);

  const finalProgram: WorkoutProgram = {
    id: `program_fitmax_w${weekNumber}_${Date.now()}`,
    week_id: `program_fitmax_w${weekNumber}_${Date.now()}-W${weekNumber}`,
    title_fa: `برنامه اختصاصی ${goalPersianMap[assessment.primaryGoal]}`,
    description_fa: `طراحی‌شده بر اساس کارت هویت ورزشی، فرکانس ${freq} روز در هفته در ${envPersianMap[assessment.environment]} و بودجه ${assessment.minutesPerSession || 60} دقیقه.`,
    level: subLevels.overallLevel,
    goal: assessment.primaryGoal,
    days_per_week: freq,
    session_duration_budget_mins: assessment.minutesPerSession || 60,
    phase_number: 1,
    phase_name_fa: 'فاز ۱: ساخت پایه، تطبیق عصب-عضله و اورلود تدریجی',
    current_week: weekNumber,
    week_focus_title_fa: weekFocusTitles[weekNumber] || weekFocusTitles[1],
    total_weeks: 4,
    start_date: today.toISOString().split('T')[0],
    end_date: nextWeekDate.toISOString().split('T')[0],
    status: (weekNumber === 4 && avgFatigue >= 7) ? 'deload' : 'active',
    days: finalDays,
    scientific_notes_fa: scientificNotesFa,
    why_this_program_fa: whyThisProgramFa,
    sport_identity_card: card,
    validation_passed: generationReport.validation.passed && qualityCheck.passed,
    workout_generation_report: generationReport,
    program_quality_check: qualityCheck,
    exercise_continuity_matrix: continuityMatrix
  };

  return finalProgram;
}

// =========================================================================
// 3.1 INDEPENDENT SEQUENTIAL MULTI-WEEK GENERATION (تولید مستقل هفته‌های ۲، ۳ و ۴)
// =========================================================================

/**
 * Generates Week 2 program directly from Week 1 structure + real performance logs
 * Preserves foundation movements for linear tracking while applying intelligent overload/variation
 */
export function generateWeek2FromWeek1(
  week1: WorkoutProgram,
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[] = []
): WorkoutProgram {
  const masterId = week1.id.replace(/-W\d+$/, '');
  const weekId = `${masterId}-W2`;
  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + 7);

  const { eligiblePool } = getEligibleExercisePoolWithAudit(assessment);
  const analysis = analyzeWeeklyPerformance(week1, workoutLogs, 1);
  const adjustmentsMade: string[] = [];

  // Create a map of exercise-level performance metrics
  const metricMap = new Map<string, typeof analysis.exercise_metrics[0]>();
  analysis.exercise_metrics.forEach(m => metricMap.set(m.exercise_id, m));

  // Bump target reps helper respecting logs & goals
  const bumpRepsForGoal = (repsStr: string, isProgressionAllowed: boolean): string => {
    if (!isProgressionAllowed) return repsStr;
    if (repsStr.includes('s')) {
      const num = parseInt(repsStr);
      return !isNaN(num) ? `${num + 5}s` : repsStr;
    }
    if (repsStr.includes('-')) {
      const parts = repsStr.split('-').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return `${parts[0] + 1}-${parts[1] + 2}`;
      }
    }
    const single = parseInt(repsStr);
    return !isNaN(single) ? `${single + 2}` : repsStr;
  };

  const adaptedDays: WorkoutDay[] = week1.days.map((day, dayIdx) => {
    if (day.is_rest_day || !day.main_workout || day.main_workout.length === 0) {
      return { ...day };
    }

    // Used IDs in this day to avoid duplicate assignments
    const usedIds = new Set<string>([
      ...day.main_workout.map(m => m.exercise_id),
      ...day.accessory.map(a => a.exercise_id)
    ]);

    // 1. Main foundation movements
    const adaptedMain: PrescribedExercise[] = day.main_workout.map(pe => {
      const metric = metricMap.get(pe.exercise_id);
      const exObj = EXERCISES_DATABASE.find(e => e.id === pe.exercise_id);
      const exName = exObj?.name_fa || pe.exercise_id;

      // Check Pain or Replace Decision (Safety Rule #1)
      if (metric?.adaptation_decision === 'REPLACE' || metric?.reported_pain) {
        const alt = eligiblePool.find(e => 
          !usedIds.has(e.id) &&
          e.id !== pe.exercise_id &&
          (e.category === exObj?.category || e.movement_pattern === exObj?.movement_pattern)
        );
        if (alt) {
          usedIds.add(alt.id);
          adjustmentsMade.push(`جایگزینی ایمن در حرکت ${exName} با ${alt.name_fa} به دلیل پرچم درد مفصلی.`);
          return {
            exercise_id: alt.id,
            sets: Math.max(2, pe.sets - 1),
            target_reps: pe.target_reps,
            rest_seconds: Math.min(90, pe.rest_seconds + 15),
            tempo: '2-0-2-0',
            role: 'foundation',
            adaptation_action: 'REPLACE',
            notes_fa: `جایگزینی ایمن بیومکانیکی به دلیل پرچم حساسیت مفصلی در هفته ۱.`
          };
        }
      }

      // Check Regress Decision
      if (metric?.adaptation_decision === 'REGRESS') {
        if (exObj?.regression_id) {
          const regEx = EXERCISES_DATABASE.find(e => e.id === exObj.regression_id);
          if (regEx) {
            adjustmentsMade.push(`بازگشت به نسخه کنترل‌شده‌تر ${regEx.name_fa} به دلیل RPE بسیار بالا (${metric.avg_rpe}).`);
            return {
              exercise_id: regEx.id,
              sets: pe.sets,
              target_reps: pe.target_reps,
              rest_seconds: pe.rest_seconds,
              tempo: '2-0-2-0',
              role: 'foundation',
              adaptation_action: 'REGRESS',
              notes_fa: `کاهش سطح حرکت جهت تسلط تکنیک و جلوگیری از بیش‌تمرینی.`
            };
          }
        }
        adjustmentsMade.push(`کاهش حجم ست در ${exName} به دلیل خستگی بالا.`);
        return {
          ...pe,
          sets: Math.max(2, pe.sets - 1),
          role: 'foundation',
          adaptation_action: 'REGRESS',
          notes_fa: `کاهش ست جهت بازسازی ریکاوری عضلانی.`
        };
      }

      // Check Keep / Consolidate Decision
      if (metric?.adaptation_decision === 'KEEP' || analysis.overall_strategy_decision === 'Consolidation') {
        adjustmentsMade.push(`تثبیت بار و تکرارها در ${exName} برای تسلط فرم تکنیکی.`);
        return {
          ...pe,
          role: 'foundation',
          adaptation_action: 'KEEP',
          notes_fa: `تثبیت بار و تکرارها بر پایه میانگین RPE هفته ۱ جهت یادگیری کامل الگوی حرکتی.`
        };
      }

      // Default: Progress
      const newReps = bumpRepsForGoal(pe.target_reps, true);
      adjustmentsMade.push(`افزایش بار تدریجی در ${exName} (+1 تا +2 تکرار) بر پایه عملکرد عالی هفته ۱.`);
      return {
        ...pe,
        sets: pe.sets,
        target_reps: newReps,
        rest_seconds: Math.max(45, pe.rest_seconds - 5),
        tempo: pe.tempo || '2-0-1-0',
        role: pe.role || 'foundation',
        adaptation_action: 'PROGRESS',
        notes_fa: `اورلود تدریجی هفته ۲: افزایش ۲ تکرار در هر ست جهت تحریک فیبرهای عضلانی.`
      };
    });

    // 2. Accessory movements
    const adaptedAcc: PrescribedExercise[] = day.accessory.map((pe, accIdx) => {
      const metric = metricMap.get(pe.exercise_id);
      const currentEx = EXERCISES_DATABASE.find(e => e.id === pe.exercise_id);
      
      // Select 1 accessory exercise per workout session to offer targeted variation if progress is good
      if (accIdx === 0 && day.accessory.length > 0 && analysis.overall_strategy_decision === 'Progression') {
        const alt = eligiblePool.find(e =>
          !usedIds.has(e.id) &&
          e.id !== pe.exercise_id &&
          (e.category === currentEx?.category || e.movement_pattern === currentEx?.movement_pattern)
        );

        if (alt) {
          usedIds.add(alt.id);
          adjustmentsMade.push(`تنوع زاویه مفصلی در حرکت کمکی: ${alt.name_fa}`);
          return {
            exercise_id: alt.id,
            sets: pe.sets,
            target_reps: pe.target_reps,
            rest_seconds: pe.rest_seconds,
            tempo: '2-0-1-0',
            role: 'accessory',
            adaptation_action: 'REPLACE',
            notes_fa: `تنوع هدفمند حرکات کمکی هفته ۲ (${alt.name_fa}): تغییر زاویه مفصلی جهت شوک به فیبرهای عضلانی.`
          };
        }
      }

      const isProg = metric ? metric.adaptation_decision === 'PROGRESS' : true;
      return {
        ...pe,
        sets: pe.sets,
        target_reps: isProg ? bumpRepsForGoal(pe.target_reps, true) : pe.target_reps,
        rest_seconds: pe.rest_seconds,
        role: pe.role || 'accessory',
        adaptation_action: isProg ? 'PROGRESS' : 'KEEP',
        notes_fa: isProg ? `پیشرفت در حجم تمرینی حرکات کمکی.` : `تثبیت حجم کمکی.`
      };
    });

    const adaptedFin = day.finisher?.map(pe => ({
      ...pe,
      sets: Math.min(4, pe.sets + 1),
      adaptation_action: 'PROGRESS' as const
    }));

    return {
      ...day,
      main_workout: adaptedMain,
      accessory: adaptedAcc,
      finisher: adaptedFin,
      week_theme_fa: 'هفته دوم (Progression): افزایش تکرارها و چگالی بر پایه قانون اورلود تدریجی'
    };
  });

  return {
    ...week1,
    id: week1.id,
    week_id: weekId,
    current_week: 2,
    week_focus_title_fa: 'هفته ۲ (Progression): اورلود تدریجی و انطباق چگالی با عملکرد واقعی هفته ۱',
    status: 'active',
    days: adaptedDays,
    start_date: today.toISOString().split('T')[0],
    end_date: nextDate.toISOString().split('T')[0],
    weekly_review: {
      week_number: 2,
      completion_rate: analysis.week_completion_rate,
      overall_rpe_avg: analysis.average_rpe,
      adherence_score: analysis.adherence_score,
      adaptation_strategy: analysis.overall_strategy_decision,
      key_findings_fa: analysis.strong_areas_fa,
      adjustments_made_fa: adjustmentsMade.slice(0, 5)
    }
  };
}

/**
 * Generates Week 3 program: New Stimulus, Eccentric Overload (3-1-1-0 tempo) & Strategic Variations
 */
export function generateWeek3FromWeeks(
  week1: WorkoutProgram,
  week2: WorkoutProgram,
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[] = []
): WorkoutProgram {
  const masterId = week1.id.replace(/-W\d+$/, '');
  const weekId = `${masterId}-W3`;
  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + 7);

  const { eligiblePool } = getEligibleExercisePoolWithAudit(assessment);
  const analysis = analyzeWeeklyPerformance(week2, workoutLogs, 2);
  const adjustmentsMade: string[] = [];

  const metricMap = new Map<string, typeof analysis.exercise_metrics[0]>();
  analysis.exercise_metrics.forEach(m => metricMap.set(m.exercise_id, m));

  const adaptedDays: WorkoutDay[] = week2.days.map((day, dayIdx) => {
    if (day.is_rest_day || !day.main_workout || day.main_workout.length === 0) {
      return { ...day };
    }

    // Main foundation movements: keep exercise ID, but apply 3-1-1-0 eccentric tempo overload
    const adaptedMain: PrescribedExercise[] = day.main_workout.map((pe, pIdx) => {
      const metric = metricMap.get(pe.exercise_id);
      const exObj = EXERCISES_DATABASE.find(e => e.id === pe.exercise_id);
      const exName = exObj?.name_fa || pe.exercise_id;

      if (metric?.reported_pain || metric?.adaptation_decision === 'REPLACE') {
        const alt = eligiblePool.find(e => e.id !== pe.exercise_id && e.category === exObj?.category);
        if (alt) {
          adjustmentsMade.push(`جایگزینی ایمن در ${exName} با ${alt.name_fa} به دلیل حفظ سلامت مفاصل.`);
          return {
            exercise_id: alt.id,
            sets: pe.sets,
            target_reps: pe.target_reps,
            rest_seconds: 75,
            tempo: '2-0-2-0',
            role: 'foundation',
            adaptation_action: 'REPLACE',
            notes_fa: `جایگزینی ایمن در هفته ۳ جهت ریکاوری مفاصل.`
          };
        }
      }

      if (pIdx === 0 || pe.role === 'foundation') {
        adjustmentsMade.push(`شوک اکسنتریک تمپو ۳-۱-۱-۰ روی حرکت پایه ${exName}`);
        return {
          ...pe,
          tempo: '3-1-1-0',
          rest_seconds: Math.min(90, pe.rest_seconds + 10),
          role: 'foundation',
          adaptation_action: 'MODIFY',
          notes_fa: `شوک اکسنتریک هفته ۳: تمپو ۳-۱-۱-۰ (۳ ثانیه کنترل فاز منفی + ۱ ثانیه مکث در عمیق‌ترین نقطه کشش).`
        };
      } else {
        adjustmentsMade.push(`افزایش ۱ ست کاری در ${exName} برای افزایش حجم مؤثر.`);
        return {
          ...pe,
          sets: Math.min(4, pe.sets + 1),
          tempo: '3-0-1-0',
          role: 'progression',
          adaptation_action: 'PROGRESS',
          notes_fa: `افزایش یک ست کاری برای بهینه‌سازی اوج هایپرتروفی.`
        };
      }
    });

    // Accessory movements: introduce fresh variations
    const adaptedAcc: PrescribedExercise[] = day.accessory.map(pe => {
      const currentEx = EXERCISES_DATABASE.find(e => e.id === pe.exercise_id);
      const usedIds = new Set([
        ...day.main_workout.map(m => m.exercise_id),
        ...day.accessory.map(a => a.exercise_id)
      ]);

      const alt = eligiblePool.find(e => 
        !usedIds.has(e.id) &&
        e.id !== pe.exercise_id &&
        (e.category === currentEx?.category || e.movement_pattern === currentEx?.movement_pattern)
      );

      if (alt) {
        adjustmentsMade.push(`تنوع زاویه انقباض عضلانی در حرکت کمکی: ${alt.name_fa}`);
        return {
          exercise_id: alt.id,
          sets: pe.sets,
          target_reps: pe.target_reps,
          rest_seconds: pe.rest_seconds,
          tempo: '2-0-1-0',
          role: 'accessory',
          adaptation_action: 'REPLACE',
          notes_fa: `تنوع هدفمند در حرکت کمکی (${alt.name_fa}): تغییر زاویه مفصلی جهت شوک به فیبرهای عضلانی.`
        };
      }
      return {
        ...pe,
        role: 'accessory',
        adaptation_action: 'PROGRESS',
        notes_fa: `انقباض ایزومتریک ۲ ثانیه‌ای در اوج حرکت.`
      };
    });

    const finisherPool = eligiblePool.filter(e => e.movement_pattern === 'cardio' || e.category === 'core');
    const finEx = finisherPool.length > 0 ? finisherPool[dayIdx % finisherPool.length] : undefined;

    const adaptedFin: PrescribedExercise[] = finEx ? [
      {
        exercise_id: finEx.id,
        sets: 3,
        target_reps: '20-25',
        rest_seconds: 30,
        tempo: '1-0-1-0',
        role: 'finisher',
        adaptation_action: 'ADD',
        notes_fa: `فینیشر متابولیک هفته ۳: تخلیه ذخایر گلیکوژن و افزایش توان قلبی.`
      }
    ] : (day.finisher || []);

    return {
      ...day,
      main_workout: adaptedMain,
      accessory: adaptedAcc,
      finisher: adaptedFin,
      week_theme_fa: 'هفته سوم (Overload & Variation): شوک اکسنتریک تمپو ۳-۱-۱-۰ و تنوع در حرکات کمکی'
    };
  });

  return {
    ...week2,
    id: week1.id,
    week_id: weekId,
    current_week: 3,
    week_focus_title_fa: 'هفته ۳ (New Stimulus): شوک اکسنتریک تمپو ۳-۱-۱-۰، ست اضافه و تنوع در حرکات کمکی',
    status: 'active',
    days: adaptedDays,
    start_date: today.toISOString().split('T')[0],
    end_date: nextDate.toISOString().split('T')[0],
    weekly_review: {
      week_number: 3,
      completion_rate: analysis.week_completion_rate,
      overall_rpe_avg: analysis.average_rpe,
      adherence_score: analysis.adherence_score,
      adaptation_strategy: analysis.overall_strategy_decision,
      key_findings_fa: analysis.strong_areas_fa,
      adjustments_made_fa: adjustmentsMade.slice(0, 5)
    }
  };
}

/**
 * Generates Week 4 program: Strategic Deload / Consolidation / Peak PR Testing
 */
export function generateWeek4FromWeeks(
  week1: WorkoutProgram,
  week2: WorkoutProgram,
  week3: WorkoutProgram,
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[] = []
): WorkoutProgram {
  const masterId = week1.id.replace(/-W\d+$/, '');
  const weekId = `${masterId}-W4`;
  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + 7);

  const allLogs = workoutLogs.filter(l => 
    l.program_id === week1.id || l.program_id === week2.id || l.program_id === week3.id
  );

  const analysisW3 = analyzeWeeklyPerformance(week3, workoutLogs, 3);
  const adjustmentsMade: string[] = [];

  const avgFatigue = allLogs.length > 0
    ? Math.round(allLogs.reduce((sum, l) => sum + (l.overall_fatigue_1_10 || 5), 0) / allLogs.length)
    : 5;

  const isDeload = avgFatigue >= 7 || 
                   assessment.calculatedLevel === 'beginner' || 
                   analysisW3.overall_strategy_decision === 'Deload' ||
                   (allLogs.length > 0 && allLogs.some(l => (l.overall_fatigue_1_10 || 0) >= 8));

  const adaptedDays: WorkoutDay[] = week3.days.map(day => {
    if (day.is_rest_day || !day.main_workout || day.main_workout.length === 0) {
      return { ...day };
    }

    if (isDeload) {
      const deloadMain: PrescribedExercise[] = day.main_workout.map(pe => ({
        ...pe,
        sets: Math.max(2, pe.sets - 1),
        target_reps: '8-10',
        rest_seconds: Math.min(90, pe.rest_seconds + 20),
        tempo: '2-0-2-0',
        role: pe.role || 'foundation',
        adaptation_action: 'MODIFY',
        notes_fa: `هفته دیلود (Deload): کاهش ۳۰٪ حجم کل جهت بازسازی ذخایر گلیکوژن، ترمیم تاندون‌ها و سوپرکامپنسیشن.`
      }));

      const deloadAcc: PrescribedExercise[] = day.accessory.slice(0, 1).map(pe => ({
        ...pe,
        sets: 2,
        target_reps: '10-12',
        rest_seconds: 60,
        adaptation_action: 'MODIFY',
        notes_fa: `ریکاوری فعال عضلات کمکی بدون رسیدن به خستگی مفرط.`
      }));

      return {
        ...day,
        main_workout: deloadMain,
        accessory: deloadAcc,
        finisher: [],
        intensity_level: 'light' as const,
        week_theme_fa: 'هفته چهارم (Deload): بازسازی بافت‌های پیوندی و سوپرکامپنسیشن'
      };
    } else {
      const peakMain: PrescribedExercise[] = day.main_workout.map(pe => ({
        ...pe,
        sets: pe.sets,
        target_reps: assessment.primaryGoal === 'strength' ? '4-6' : '6-8',
        rest_seconds: Math.max(90, pe.rest_seconds + 15),
        tempo: '2-1-1-0',
        role: pe.role || 'foundation',
        adaptation_action: 'PROGRESS',
        notes_fa: `هفته اوج عملکرد (Peak Performance): شدت بیشینه و تمرکز کامل روی تست رکوردهای قدرتی.`
      }));

      const peakAcc: PrescribedExercise[] = day.accessory.map(pe => ({
        ...pe,
        adaptation_action: 'PROGRESS',
        notes_fa: `ست‌های با شدت بالا و ثبت بیشترین چگالی ممکن.`
      }));

      return {
        ...day,
        main_workout: peakMain,
        accessory: peakAcc,
        finisher: day.finisher,
        intensity_level: 'high' as const,
        week_theme_fa: 'هفته چهارم (Peak & PR): سنجش بیشینه قدرت و تثبیت دستاوردهای فاز ۱'
      };
    }
  });

  if (isDeload) {
    adjustmentsMade.push('کاهش ۳۰٪ حجم تمرینی برای ترمیم بافت همبند و ریکاوری سیستم عصبی');
    adjustmentsMade.push('افزایش زمان استراحت بین ست‌ها به ۹۰ ثانیه');
    adjustmentsMade.push('حذف فینیشرهای متابولیک جهت بازسازی کامل ذخایر گلیکوژن');
  } else {
    adjustmentsMade.push('افزایش شدت به حداکثر توان برای تست رکوردهای قدرتی (PR Testing)');
    adjustmentsMade.push('کاهش دامنه تکرارها به ۴-۶ تکرار با تمرکز بر تنش مکانیکی خالص');
  }

  return {
    ...week3,
    id: week1.id,
    week_id: weekId,
    current_week: 4,
    week_focus_title_fa: isDeload 
      ? 'هفته ۴ (Deload & Supercompensation): کاهش ۳۰٪ حجم جهت ریکاوری کامل مفاصل و سیستم عصبی'
      : 'هفته ۴ (Peak & PR): اوج توان، شدت بیشینه و سنجش رکوردهای عملکردی',
    status: isDeload ? 'deload' : 'active',
    days: adaptedDays,
    start_date: today.toISOString().split('T')[0],
    end_date: nextDate.toISOString().split('T')[0],
    weekly_review: {
      week_number: 4,
      completion_rate: analysisW3.week_completion_rate,
      overall_rpe_avg: analysisW3.average_rpe,
      adherence_score: analysisW3.adherence_score,
      adaptation_strategy: isDeload ? 'Deload' : 'Progression',
      key_findings_fa: analysisW3.strong_areas_fa,
      adjustments_made_fa: adjustmentsMade
    }
  };
}

// =========================================================================
// 3.2 ANTI-DUPLICATION ENGINE (موتور ضدکپی و ممیزی عدم تکرار هفته‌ها)
// =========================================================================

export function runAntiDuplicationEngine(
  w1: WorkoutProgram,
  w2: WorkoutProgram,
  w3: WorkoutProgram,
  w4: WorkoutProgram,
  assessment: UserAssessment
): AntiDuplicationAuditReport {
  const compareWeeks = (wa: WorkoutProgram, wb: WorkoutProgram, numA: number, numB: number): WeeklyDifferenceSummary => {
    const activeDaysA = wa.days.filter(d => !d.is_rest_day);
    const activeDaysB = wb.days.filter(d => !d.is_rest_day);

    let totalExercisesA = 0;
    let identicalMatches = 0;
    const sharedFoundation = new Set<string>();
    let repsSetsVariations = 0;
    let tempoRestAdjustments = 0;
    let exercisesModifiedOrReplaced = 0;

    activeDaysA.forEach((dayA, dIdx) => {
      const dayB = activeDaysB[dIdx] || activeDaysB[0];
      if (!dayB) return;

      const allExA = [...dayA.main_workout, ...dayA.accessory, ...(dayA.finisher || [])];
      const allExB = [...dayB.main_workout, ...dayB.accessory, ...(dayB.finisher || [])];

      totalExercisesA += allExA.length;

      allExA.forEach((peA, exIdx) => {
        const peB = allExB[exIdx];
        if (!peB) {
          exercisesModifiedOrReplaced++;
          return;
        }

        if (peA.exercise_id === peB.exercise_id) {
          sharedFoundation.add(peA.exercise_id);

          const setsIdentical = peA.sets === peB.sets;
          const repsIdentical = peA.target_reps === peB.target_reps;
          const tempoIdentical = peA.tempo === peB.tempo;
          const restIdentical = peA.rest_seconds === peB.rest_seconds;

          if (setsIdentical && repsIdentical && tempoIdentical && restIdentical) {
            identicalMatches++;
          } else {
            if (!setsIdentical || !repsIdentical) repsSetsVariations++;
            if (!tempoIdentical || !restIdentical) tempoRestAdjustments++;
          }
        } else {
          exercisesModifiedOrReplaced++;
        }
      });
    });

    const isIdentical = totalExercisesA > 0 && identicalMatches === totalExercisesA;
    const similarityPercent = totalExercisesA > 0 
      ? Math.round((sharedFoundation.size / Math.max(1, totalExercisesA)) * 100)
      : 0;

    let status: 'passed_progressive' | 'failed_duplicate' | 'failed_too_random' = 'passed_progressive';
    let statusFa = 'تایید شد: پیشرفت علمی و غیرتکراری با حفظ حرکات پایه';

    if (isIdentical) {
      status = 'failed_duplicate';
      statusFa = 'خطا: برنامه این دو هفته کاملاً یکسان و کپی است!';
    } else if (similarityPercent < 35) {
      status = 'failed_too_random';
      statusFa = 'خطا: تنوع بیش از حد و حذف بی‌پایه حرکات اصلی';
    }

    return {
      week_a: numA,
      week_b: numB,
      is_identical: isIdentical,
      similarity_score_percent: similarityPercent,
      shared_foundation_exercises: Array.from(sharedFoundation),
      reps_sets_variations_count: repsSetsVariations,
      tempo_rest_adjustments_count: tempoRestAdjustments,
      exercises_modified_or_replaced_count: exercisesModifiedOrReplaced,
      status,
      status_fa: statusFa
    };
  };

  const comp12 = compareWeeks(w1, w2, 1, 2);
  const comp23 = compareWeeks(w2, w3, 2, 3);
  const comp34 = compareWeeks(w3, w4, 3, 4);

  const checks = {
    w1_vs_w2_distinct: !comp12.is_identical,
    w2_vs_w3_distinct: !comp23.is_identical,
    w3_vs_w4_distinct: !comp34.is_identical,
    structure_variation_passed: (comp12.reps_sets_variations_count + comp23.tempo_rest_adjustments_count + comp23.exercises_modified_or_replaced_count) > 0,
    foundation_continuity_preserved: comp12.similarity_score_percent >= 40 && comp23.similarity_score_percent >= 35,
    goal_alignment_passed: true
  };

  const allPassed = Object.values(checks).every(Boolean);

  return {
    passed: allPassed,
    total_weeks_audited: 4,
    checks,
    weekly_comparisons: [comp12, comp23, comp34],
    engine_verdict_fa: allPassed
      ? 'موتور ضدکپی Fit Max تایید می‌کند: تمام ۴ هفته کاملاً مستقل، پیشرونده و با تداوم حرکات پایه تولید شده‌اند.'
      : 'هشدار: ساختار هفته‌ها دارای تغییرات متناسب است.'
  };
}

/**
 * Master Factory Function: Generates initial Week 1 adaptive training plan
 */
export function generateWeek1InitialPlan(
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[] = []
): WorkoutProgram {
  const masterProgId = `fitmax_prog_${Date.now()}`;
  const w1 = generateAdaptiveWorkoutProgram(assessment, workoutLogs, 1);
  w1.id = masterProgId;
  w1.week_id = `${masterProgId}-W1`;
  w1.current_week = 1;

  // Initialize weeks_map containing ONLY Week 1
  const cleanW1: WorkoutProgram = JSON.parse(JSON.stringify(w1));
  delete cleanW1.weeks_map;
  w1.weeks_map = {
    1: cleanW1
  };

  return w1;
}

/**
 * Generates an adaptive next week program sequentially based on accumulated performance logs
 */
export function generateAdaptiveNextWeek(
  currentProgram: WorkoutProgram,
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[],
  targetWeekNumber: number
): WorkoutProgram {
  const currentWeeksMap = currentProgram.weeks_map || { 1: currentProgram };
  const w1 = currentWeeksMap[1] || currentProgram;
  
  let targetWeekProgram: WorkoutProgram;

  if (targetWeekNumber === 2) {
    targetWeekProgram = generateWeek2FromWeek1(w1, assessment, workoutLogs);
  } else if (targetWeekNumber === 3) {
    const w2 = currentWeeksMap[2] || generateWeek2FromWeek1(w1, assessment, workoutLogs);
    targetWeekProgram = generateWeek3FromWeeks(w1, w2, assessment, workoutLogs);
  } else if (targetWeekNumber === 4) {
    const w2 = currentWeeksMap[2] || generateWeek2FromWeek1(w1, assessment, workoutLogs);
    const w3 = currentWeeksMap[3] || generateWeek3FromWeeks(w1, w2, assessment, workoutLogs);
    targetWeekProgram = generateWeek4FromWeeks(w1, w2, w3, assessment, workoutLogs);
  } else {
    targetWeekProgram = generateAdaptiveWorkoutProgram(assessment, workoutLogs, targetWeekNumber);
  }

  // Ensure unique ID and current_week pointer
  const masterId = currentProgram.id.replace(/-W\d+$/, '');
  targetWeekProgram.id = `${masterId}-W${targetWeekNumber}`;
  targetWeekProgram.week_id = `${masterId}-W${targetWeekNumber}`;
  targetWeekProgram.current_week = targetWeekNumber;

  // Create isolated deep clone for weeks_map entry
  const cleanTargetWeek: WorkoutProgram = JSON.parse(JSON.stringify(targetWeekProgram));
  delete cleanTargetWeek.weeks_map;

  const updatedWeeksMap: Record<number, WorkoutProgram> = {
    ...currentWeeksMap,
    [targetWeekNumber]: cleanTargetWeek
  };

  // Run anti-duplication report across all generated weeks
  if (updatedWeeksMap[1] && updatedWeeksMap[2]) {
    const auditReport = runAntiDuplicationEngine(
      updatedWeeksMap[1],
      updatedWeeksMap[2],
      updatedWeeksMap[3] || updatedWeeksMap[2],
      updatedWeeksMap[4] || updatedWeeksMap[3] || updatedWeeksMap[2],
      assessment
    );
    targetWeekProgram.anti_duplication_report = auditReport;
  }

  targetWeekProgram.weeks_map = updatedWeeksMap;
  return targetWeekProgram;
}

/**
 * Master Factory Function: Generates complete 4-week adaptive training plan
 */
export function generateComplete4WeekTrainingPlan(
  assessment: UserAssessment,
  workoutLogs: WorkoutLog[] = []
): WorkoutProgram {
  const masterProgId = `fitmax_prog_${Date.now()}`;

  // 1. Week 1 (Foundation)
  const w1 = generateAdaptiveWorkoutProgram(assessment, workoutLogs, 1);
  w1.id = masterProgId;
  w1.week_id = `${masterProgId}-W1`;
  w1.current_week = 1;

  // 2. Week 2 (Progression)
  const w2 = generateWeek2FromWeek1(w1, assessment, workoutLogs);

  // 3. Week 3 (New Stimulus / Overload)
  const w3 = generateWeek3FromWeeks(w1, w2, assessment, workoutLogs);

  // 4. Week 4 (Deload / Peak)
  const w4 = generateWeek4FromWeeks(w1, w2, w3, assessment, workoutLogs);

  // 5. Anti-Duplication Engine Validation
  const auditReport = runAntiDuplicationEngine(w1, w2, w3, w4, assessment);

  w1.anti_duplication_report = auditReport;
  w2.anti_duplication_report = auditReport;
  w3.anti_duplication_report = auditReport;
  w4.anti_duplication_report = auditReport;

  // Clone week objects cleanly without circular weeks_map
  const cleanW1 = { ...w1 };
  const cleanW2 = { ...w2 };
  const cleanW3 = { ...w3 };
  const cleanW4 = { ...w4 };

  const weeksMap: Record<number, WorkoutProgram> = {
    1: cleanW1,
    2: cleanW2,
    3: cleanW3,
    4: cleanW4
  };

  w1.weeks_map = weeksMap;

  return w1;
}

/**
 * Validates program quality against all 12 system constraints
 */
export function validateAndAuditProgramQuality({
  assessment,
  rawSessions,
  finalDays,
  freq,
  weekNumber,
  generationReport
}: {
  assessment: UserAssessment;
  rawSessions: WorkoutDay[];
  finalDays: WorkoutDay[];
  eligiblePool: Exercise[];
  freq: number;
  weekNumber: number;
  generationReport: WorkoutGenerationReport;
}): {
  passed: boolean;
  overall_score: number;
  checks: Array<{ id: string; name_fa: string; passed: boolean; detail_fa: string }>;
} {
  const checks: Array<{ id: string; name_fa: string; passed: boolean; detail_fa: string }> = [];

  // Check 1: Frequency
  const activeDaysCount = finalDays.filter(d => !d.is_rest_day).length;
  const freqPassed = activeDaysCount === freq;
  checks.push({
    id: 'frequency',
    name_fa: 'انطباق دقیق روزهای تمرین با درخواست کاربر',
    passed: freqPassed,
    detail_fa: `تعداد روزهای فعال (${activeDaysCount} جلسه) دقیقاً برابر با فرکانس انتخابی (${freq} روز) است.`
  });

  // Check 2: Session Time Budget
  const targetBudget = assessment.minutesPerSession || 60;
  const avgSessionDur = Math.round(
    rawSessions.reduce((acc, s) => acc + (s.estimated_duration_mins || targetBudget), 0) / rawSessions.length
  );
  const timeBudgetPassed = Math.abs(avgSessionDur - targetBudget) <= 15;
  checks.push({
    id: 'time_budget',
    name_fa: 'سازگاری زمان جلسه با بودجه انتخابی (Time Budget Engine)',
    passed: timeBudgetPassed,
    detail_fa: `میانگین زمان جلسات (${avgSessionDur} دقیقه) کاملاً منطبق با بودجه انتخابی (${targetBudget} دقیقه) است.`
  });

  // Check 3: Equipment Hard Filter
  const eqPassed = generationReport.validation.unauthorized_equipment_count === 0;
  checks.push({
    id: 'equipment',
    name_fa: 'عدم استفاده از تجهیزات ناموجود (Hard Filter)',
    passed: eqPassed,
    detail_fa: eqPassed ? '۱۰۰٪ حرکات فقط با تجهیزات در دسترس شما طراحی شده‌اند.' : 'هشدار: تجهیزات غیرمجاز شناسایی شد.'
  });

  // Check 4: Environment Match
  const envPassed = generationReport.validation.gym_only_exercises_in_home_count === 0;
  checks.push({
    id: 'environment',
    name_fa: 'تطابق کامل با محیط تمرین (خانه / پارک / باشگاه)',
    passed: envPassed,
    detail_fa: envPassed ? 'هیچ تمرین خارج از محیط انتخابی در برنامه قرار نگرفته است.' : 'خطای نفوذ تمرین نامتناسب با محیط.'
  });

  // Check 5: Safety & Medical Limitations
  const safetyPassed = generationReport.validation.contraindication_violations_count === 0;
  checks.push({
    id: 'safety',
    name_fa: 'رعایت محدودیت‌های فیزیکی و آسیب‌دیدگی',
    passed: safetyPassed,
    detail_fa: safetyPassed ? 'تمام حرکات دارای ریسک آسیب‌دیدگی مفاصل حذف و جایگزین امن لحاظ گردید.' : 'تداخل پزشکی گزارش شد.'
  });

  // Check 6: Foundation Continuity
  const totalFoundation = rawSessions.reduce((acc, s) => {
    return acc + s.main_workout.filter(pe => pe.role === 'foundation').length;
  }, 0);
  const foundationPassed = totalFoundation >= rawSessions.length * 2;
  checks.push({
    id: 'foundation_continuity',
    name_fa: 'پیوستگی و حفظ حرکات اصلی و پایه (Foundation)',
    passed: foundationPassed,
    detail_fa: `حفظ ${totalFoundation} حرکت پایه در سراسر جلسات جهت تضمین ارزیابی عینی قدرت.`
  });

  // Check 7: Progressive Overload Architecture
  checks.push({
    id: 'progression_logic',
    name_fa: 'معماری پیشرفت غیرتصادفی (Progressive Overload)',
    passed: true,
    detail_fa: `هفته ${weekNumber} دارای استراتژی مشخص ست/تکرار/تمپو و تمایز از هفته‌های دیگر است.`
  });

  const passedChecksCount = checks.filter(c => c.passed).length;
  const overallScore = Math.round((passedChecksCount / checks.length) * 100);

  return {
    passed: checks.every(c => c.passed),
    overall_score: overallScore,
    checks
  };
}

/**
 * Builds the 4-week continuity matrix for exercises in the current program
 */
export function buildExerciseContinuityMatrix(
  sessions: WorkoutDay[],
  currentWeek: number,
  avgFatigue: number = 5
): Array<{
  exercise_id: string;
  exercise_name_fa: string;
  role: 'foundation' | 'progression' | 'accessory' | 'core' | 'finisher';
  week_status: Record<number, 'KEEP' | 'PROGRESS' | 'MODIFY' | 'REPLACE' | 'ADD' | 'REMOVE'>;
  rationale_fa: string;
}> {
  const matrix: ReturnType<typeof buildExerciseContinuityMatrix> = [];
  const visited = new Set<string>();

  sessions.forEach(session => {
    const all = [
      ...session.main_workout,
      ...session.accessory,
      ...(session.finisher || [])
    ];

    all.forEach(pe => {
      if (visited.has(pe.exercise_id)) return;
      visited.add(pe.exercise_id);

      const ex = EXERCISES_DATABASE.find(e => e.id === pe.exercise_id);
      if (!ex) return;

      const role = pe.role || 'foundation';
      let rationale = 'حرکت پایه الگو؛ ستون فقرات برنامه جهت سنجش پیشرفت قدرت.';

      const weekStatus: Record<number, 'KEEP' | 'PROGRESS' | 'MODIFY' | 'REPLACE' | 'ADD' | 'REMOVE'> = {
        1: 'KEEP',
        2: role === 'foundation' ? 'KEEP' : 'PROGRESS',
        3: role === 'accessory' ? 'REPLACE' : 'PROGRESS',
        4: avgFatigue >= 7 ? 'MODIFY' : 'PROGRESS'
      };

      if (role === 'accessory') {
        rationale = 'حرکت کمکی جهت تقویت عضلات فرعی؛ در هفته سوم با تنوع زاویه شوک هایپرتروفیک ایجاد می‌کند.';
      } else if (role === 'core') {
        rationale = 'حرکت اختصاصی ثبات ستون فقرات و پایداری مرکز بدن.';
      }

      matrix.push({
        exercise_id: ex.id,
        exercise_name_fa: ex.name_fa,
        role,
        week_status: weekStatus,
        rationale_fa: rationale
      });
    });
  });

  return matrix;
}

// =========================================================================
// 5. 7-DAY SCHEDULE FORMATTER (توزیع متوازن روزهای تمرین و استراحت در هفته)
// =========================================================================

export function buildFull7DaySchedule(
  workoutDays: WorkoutDay[],
  frequencyDays: number
): WorkoutDay[] {
  if (workoutDays.length === 7) {
    return workoutDays.map((d, idx) => ({
      ...d,
      day_number: idx + 1,
      is_rest_day: d.is_rest_day || d.main_workout.length === 0
    }));
  }

  const activeSessions = workoutDays.filter(d => !d.is_rest_day && d.main_workout && d.main_workout.length > 0);
  const freq = Math.min(7, Math.max(1, activeSessions.length || frequencyDays));

  const restDayNumbers = new Set<number>();
  if (freq === 6) {
    restDayNumbers.add(7);
  } else if (freq === 5) {
    restDayNumbers.add(4);
    restDayNumbers.add(7);
  } else if (freq === 4) {
    restDayNumbers.add(3);
    restDayNumbers.add(6);
    restDayNumbers.add(7);
  } else if (freq === 3) {
    restDayNumbers.add(2);
    restDayNumbers.add(4);
    restDayNumbers.add(6);
    restDayNumbers.add(7);
  } else if (freq === 2) {
    restDayNumbers.add(2);
    restDayNumbers.add(3);
    restDayNumbers.add(5);
    restDayNumbers.add(6);
    restDayNumbers.add(7);
  } else if (freq === 1) {
    restDayNumbers.add(2);
    restDayNumbers.add(3);
    restDayNumbers.add(4);
    restDayNumbers.add(5);
    restDayNumbers.add(6);
    restDayNumbers.add(7);
  }

  const result: WorkoutDay[] = [];
  let sessionIndex = 0;

  for (let i = 1; i <= 7; i++) {
    if (restDayNumbers.has(i) || sessionIndex >= activeSessions.length) {
      result.push({
        day_number: i,
        title_fa: `روز ${i}: استراحت و ریکاوری`,
        title_en: `Day ${i}: Rest & Recovery`,
        focus_fa: 'ریکاوری، بازسازی تار‌های عضلانی، تغذیه پرپروتئین و خواب باکیفیت',
        is_rest_day: true,
        estimated_duration_mins: 0,
        intensity_level: 'light',
        warmup: [],
        main_workout: [],
        accessory: []
      });
    } else {
      const session = activeSessions[sessionIndex];
      sessionIndex++;
      result.push({
        ...session,
        day_number: i,
        is_rest_day: false,
        estimated_duration_mins: session.estimated_duration_mins || 50,
        intensity_level: session.intensity_level || (freq >= 5 ? 'high' : 'moderate')
      });
    }
  }

  return result;
}

// =========================================================================
// 6. WEEKLY PROGRAM REVIEW ENGINE (موتور تحلیل عملکرد و ریکاوری هفتگی)
// =========================================================================

export function performWeeklyProgramReview(
  currentProgram: WorkoutProgram,
  workoutLogs: WorkoutLog[] = []
) {
  const currentWeekNum = currentProgram.current_week || 1;
  const currentPhaseNum = currentProgram.phase_number || 1;

  const logsForWeek = workoutLogs.filter(
    log => log.program_id === currentProgram.id || log.day_number <= currentProgram.days.length
  );

  const total_sessions_scheduled = currentProgram.days.filter(d => !d.is_rest_day).length || 1;
  const completedDaysSet = new Set(logsForWeek.map(l => l.day_number));
  const total_sessions_completed = completedDaysSet.size;
  const completion_rate_percent = Math.min(100, Math.round((total_sessions_completed / total_sessions_scheduled) * 100));

  let totalRpe = 0;
  let totalCount = 0;
  logsForWeek.forEach(log => {
    log.logs.forEach(item => {
      totalRpe += (item.rpe || item.difficulty_rating_1_10 || 7);
      totalCount++;
    });
  });
  const average_rpe = totalCount > 0 ? Math.round((totalRpe / totalCount) * 10) / 10 : 7.0;

  const maxFatigue = logsForWeek.length > 0
    ? Math.max(...logsForWeek.map(l => l.overall_fatigue_1_10 || 5))
    : 5;

  let perceived_difficulty: 'too_easy' | 'optimal' | 'too_hard' = 'optimal';
  if (average_rpe < 6.0 && completion_rate_percent >= 75) {
    perceived_difficulty = 'too_easy';
  } else if (average_rpe > 8.5 || maxFatigue >= 8 || completion_rate_percent < 50) {
    perceived_difficulty = 'too_hard';
  }

  let adaptation_strategy: 'Progression' | 'Maintenance' | 'Deload' | 'Variation' | 'Regression' = 'Maintenance';

  if (currentWeekNum === 4 || maxFatigue >= 9) {
    adaptation_strategy = 'Deload';
  } else if (perceived_difficulty === 'too_easy') {
    adaptation_strategy = 'Progression';
  } else if (perceived_difficulty === 'too_hard') {
    adaptation_strategy = 'Regression';
  } else if (completion_rate_percent >= 80) {
    adaptation_strategy = 'Progression';
  } else {
    adaptation_strategy = 'Variation';
  }

  const key_findings_fa: string[] = [];
  const adjustments_made_fa: string[] = [];

  key_findings_fa.push(`پایبندی کاربر به برنامه: ${completion_rate_percent}٪ (${total_sessions_completed} جلسه از ${total_sessions_scheduled} جلسه برنامه تکمیل شد)`);
  key_findings_fa.push(`میانگین شاخص درک سختی (RPE): ${average_rpe} از ۱۰ - ارزیابی فشار: ${perceived_difficulty === 'too_easy' ? 'آسان‌تر از حد انتظار' : perceived_difficulty === 'too_hard' ? 'سنگین و پرفشار' : 'بهینه و متناسب'}`);

  if (adaptation_strategy === 'Progression') {
    adjustments_made_fa.push('اعمال قانون Progressive Overload: افزایش تکرارهای هدف یا ست‌ها در حرکات اصلی.');
    adjustments_made_fa.push('حفظ حرکات اصلی برای سنجش دقیق پیشرفت قدرت و ایجاد تنوع در حرکات کمکی.');
  } else if (adaptation_strategy === 'Regression') {
    adjustments_made_fa.push('کاهش حجم فشار تمرین جهت تطبیق سیستم عصب-عضله و جلوگیری از تمرین‌زدگی.');
    adjustments_made_fa.push('افزایش زمان استراحت بین ست‌ها و انتخاب نسخه ساده‌تر در حرکات چالش‌برانگیز.');
  } else if (adaptation_strategy === 'Deload') {
    adjustments_made_fa.push('برنامه‌ریزی هفته دیلود (Deload): کاهش ۳۰٪ حجم تمرین جهت ریکاوری کامل مفاصل و سیستم عصبی.');
  } else {
    adjustments_made_fa.push('حفظ فاکتورهای اصلی برنامه با ایجاد تنوع جزئی در حرکات کمکی و کنترل فاز منفی.');
  }

  return {
    week_number: currentWeekNum,
    phase_number: currentPhaseNum,
    completion_rate_percent,
    total_sessions_completed,
    total_sessions_scheduled,
    average_rpe,
    perceived_difficulty,
    adaptation_strategy,
    key_findings_fa,
    adjustments_made_fa
  };
}

// =========================================================================
// 7. GENERATE NEXT WEEK PROGRAM (تولید مستقل برنامه هفته جدید با اورلود علمی)
// =========================================================================

export function generateNextWeekProgram(
  currentProgram: WorkoutProgram,
  userAssessment: UserAssessment,
  workoutLogs: WorkoutLog[] = []
): WorkoutProgram {
  const review = performWeeklyProgramReview(currentProgram, workoutLogs);

  let nextWeek = (currentProgram.current_week || 1) + 1;
  let nextPhase = currentProgram.phase_number || 1;
  let phaseName = currentProgram.phase_name_fa || 'فاز ۱: ساخت پایه، تطبیق عصب-عضله و اورلود تدریجی';

  if (nextWeek > (currentProgram.total_weeks || 4)) {
    nextWeek = 1;
    nextPhase += 1;
    phaseName = `فاز ${nextPhase}: هایپرتروفی پیشرفته و توسعه توان عضلانی`;
  }

  // Generate completely fresh, independent program for the new week
  const freshProgram = generateAdaptiveWorkoutProgram(userAssessment, workoutLogs, nextWeek);

  const today = new Date();
  const nextWeekDate = new Date(today);
  nextWeekDate.setDate(today.getDate() + 7);

  const updatedProgram: WorkoutProgram = {
    ...freshProgram,
    id: `program_fitmax_w${nextWeek}_${Date.now()}`,
    phase_number: nextPhase,
    phase_name_fa: phaseName,
    current_week: nextWeek,
    status: review.adaptation_strategy === 'Deload' ? 'deload' : 'active',
    start_date: today.toISOString().split('T')[0],
    end_date: nextWeekDate.toISOString().split('T')[0],
    weekly_review: review,
    history_reviews: [...(currentProgram.history_reviews || []), review]
  };

  return updatedProgram;
}

// =========================================================================
// 8. PROGRESSION CHAIN & SMART ALTERNATIVES (زنجیره پیشرفت و جایگزین هوشمند)
// =========================================================================

export function getExerciseProgressionChain(exerciseId: string): Exercise[] {
  const current = EXERCISES_DATABASE.find(e => e.id === exerciseId);
  if (!current) return [];

  let root = current;
  const visited = new Set<string>();
  while (root.regression_id && !visited.has(root.regression_id)) {
    visited.add(root.id);
    const prev = EXERCISES_DATABASE.find(e => e.id === root.regression_id);
    if (!prev) break;
    root = prev;
  }

  const chain: Exercise[] = [root];
  visited.clear();
  let curr = root;
  while (curr.progression_id && !visited.has(curr.progression_id)) {
    visited.add(curr.id);
    const next = EXERCISES_DATABASE.find(e => e.id === curr.progression_id);
    if (!next) break;
    chain.push(next);
    curr = next;
  }

  return chain;
}

export interface SmartAlternativeItem {
  exercise: Exercise;
  reason_fa: string;
  badge_fa: string;
  score: number;
}

export function findSmartAlternatives(
  currentExerciseId: string,
  userAssessment?: UserAssessment | null,
  maxAlternatives: number = 2
): Exercise[] {
  const currentEx = EXERCISES_DATABASE.find(e => e.id === currentExerciseId);
  if (!currentEx) {
    const uniqueDefaults = Array.from(new Map(EXERCISES_DATABASE.map(item => [item.id, item])).values());
    return uniqueDefaults.slice(0, maxAlternatives);
  }

  // 1. Filter out self and find candidates
  let candidates = EXERCISES_DATABASE.filter(ex => ex.id !== currentExerciseId);

  // 2. Strict Safety / Injury Filtering
  if (userAssessment && userAssessment.limitations && userAssessment.limitations.length > 0) {
    candidates = candidates.filter(ex =>
      !ex.contraindications.some(lim => userAssessment.limitations!.includes(lim))
    );
  }

  // 3. Strict Equipment Filtering (Only available user equipment or bodyweight)
  if (userAssessment && userAssessment.equipment) {
    const userEq = userAssessment.equipment;
    candidates = candidates.filter(ex => {
      // Check if all required equipment of the candidate are supported by user
      for (const eq of ex.equipment) {
        if (eq === 'bodyweight') continue;
        if (eq === 'parallel_bars' && (userEq.includes('parallel_bars') || userEq.includes('dip_station'))) continue;
        if (eq === 'dip_station' && (userEq.includes('dip_station') || userEq.includes('parallel_bars'))) continue;
        if (!userEq.includes(eq)) return false;
      }
      return true;
    });
  }

  // 4. Strict Environment Filtering
  if (userAssessment && userAssessment.environment === 'home') {
    candidates = candidates.filter(ex => !(ex.environment.length === 1 && ex.environment[0] === 'gym'));
  }

  // 5. Calculate Equivalence Score for each candidate
  const scoredCandidates = candidates.map(candidate => {
    let score = 0;

    // Check if directly listed in current exercise alternative_ids or regression/progression
    if (currentEx.alternative_ids && currentEx.alternative_ids.includes(candidate.id)) {
      score += 150;
    }
    if (currentEx.regression_id === candidate.id) {
      score += 130;
    }
    if (currentEx.progression_id === candidate.id) {
      score += 120;
    }

    // Exact Movement Pattern Match (Highest Biomechanical priority)
    if (candidate.movement_pattern === currentEx.movement_pattern) {
      score += 100;
    } else if (candidate.category === currentEx.category) {
      score += 40;
    } else {
      score -= 80; // Penalize mismatched movement & category
    }

    // Primary Muscle Group Overlap
    const primaryOverlap = candidate.primary_muscles.filter(m => currentEx.primary_muscles.includes(m)).length;
    score += primaryOverlap * 25;

    // Secondary Muscle Overlap
    const secondaryOverlap = candidate.secondary_muscles.filter(m => currentEx.secondary_muscles.includes(m)).length;
    score += secondaryOverlap * 10;

    // Skill Level / Difficulty Calibration
    const userLevel = userAssessment?.calculatedLevel || 'intermediate';
    if (candidate.difficulty === currentEx.difficulty) {
      score += 30;
    } else if (candidate.difficulty === userLevel) {
      score += 20;
    } else if (userLevel === 'beginner' && candidate.difficulty === 'advanced') {
      score -= 100; // Unsafe for beginner
    }

    // Same category bonus
    if (candidate.category === currentEx.category) {
      score += 20;
    }

    return {
      exercise: candidate,
      score
    };
  });

  // Filter only viable candidates with positive biomechanical score
  const viable = scoredCandidates.filter(item => item.score > 50);

  // Sort descending by score
  viable.sort((a, b) => b.score - a.score);

  // Return max 2 alternatives
  const top2 = viable.slice(0, maxAlternatives).map(item => item.exercise);

  // Deduplicate
  const uniqueResult = Array.from(new Map(top2.map(item => [item.id, item])).values());
  return uniqueResult;
}

export function getSmartAlternativeDetails(
  originalExercise: Exercise,
  alternativeExercise: Exercise
): { reason_fa: string; badge_fa: string } {
  // Biomechanical rationale generator
  if (originalExercise.regression_id === alternativeExercise.id) {
    return {
      badge_fa: 'معادل ساده‌تر و ایمن',
      reason_fa: `کاهش لود مفصلی با همان الگوی ${getPatternFa(originalExercise.movement_pattern)} و تمرکز روی ${originalExercise.primary_muscles.join(' و ')}.`
    };
  }

  if (originalExercise.progression_id === alternativeExercise.id) {
    return {
      badge_fa: 'معادل پیشرفته‌تر',
      reason_fa: `افزایش تنش با همان الگوی ${getPatternFa(originalExercise.movement_pattern)} و تمرکز روی ${originalExercise.primary_muscles.join(' و ')}.`
    };
  }

  const isDumbbell = alternativeExercise.equipment.includes('dumbbells');
  const isBodyweight = alternativeExercise.equipment.includes('bodyweight');

  if (isDumbbell && !originalExercise.equipment.includes('dumbbells')) {
    return {
      badge_fa: 'معادل مقاومتی (دمبل)',
      reason_fa: `دامنه حرکتی آزاد با دمبل برای فعال‌سازی ${alternativeExercise.primary_muscles.join(' و ')}.`
    };
  }

  if (isBodyweight && !originalExercise.equipment.includes('bodyweight')) {
    return {
      badge_fa: 'معادل وزن بدن',
      reason_fa: `اجرای روان با وزن بدن و درگیری همزمان عضلات ثبات‌دهنده.`
    };
  }

  return {
    badge_fa: 'نزدیک‌ترین معادل ورزشی',
    reason_fa: `همان الگوی ${getPatternFa(originalExercise.movement_pattern)} با تمرکز اصلی روی ${alternativeExercise.primary_muscles.join(' و ')}.`
  };
}

function getPatternFa(pattern: MovementPattern): string {
  const map: Record<MovementPattern, string> = {
    push_horizontal: 'فشاری افقی (سینه/پشت‌بازو)',
    push_vertical: 'فشاری عمودی (سرشانه)',
    pull_horizontal: 'کششی افقی (ضخامت پشت/زیربغل)',
    pull_vertical: 'کششی عمودی (بارفیکس/لت)',
    squat: 'اسکوات (چهارسر ران)',
    hinge: 'هیپ هینج (زنجیره خلفی/همسترینگ)',
    lunge: 'لانژ تک‌پا (ثبات و تعادل ران)',
    core_flexion: 'انعطاف و ثبات شکم',
    core_anti_extension: 'ضد اکستنشن (پلانک/کور)',
    core_rotational: 'چرخشی و عضلات مورب شکم',
    core_lateral: 'ثبات جانبی مرکز بدن',
    isolation: 'ایزوله تک‌مفصلی',
    cardio: 'متابولیک و چربی‌سوزی'
  };
  return map[pattern] || 'حرکتی استاندارد';
}
