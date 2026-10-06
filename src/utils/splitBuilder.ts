import { 
  WorkoutDay, 
  UserAssessment, 
  Exercise, 
  FitnessLevel, 
  PrescribedExercise,
  MovementPattern,
  EquipmentType,
  ExerciseCategory,
  ExerciseRole,
  ExerciseAdaptationAction,
  TimeBudgetBreakdown
} from '../types';
import { pickSafeExerciseFromPool, GoalStrategy } from './workoutEngine';

interface SplitBuildParams {
  assessment: UserAssessment;
  eligiblePool: Exercise[];
  subLevels: {
    overallLevel: FitnessLevel;
    pushLevel: FitnessLevel;
    pullLevel: FitnessLevel;
    legsLevel: FitnessLevel;
    coreLevel: FitnessLevel;
  };
  goalStrategy: GoalStrategy;
  weekNumber?: number;
  avgFatigueLogged?: number;
  avgRpeLogged?: number;
}

/**
 * Calculate precise active duration (in minutes) for a prescribed exercise
 */
export function calculateExerciseDuration(
  sets: number,
  reps: string,
  restSeconds: number,
  tempo: string = '2-0-1-0'
): number {
  let repCount = 10;
  if (reps.includes('s')) {
    repCount = parseInt(reps) || 30;
    const workTime = repCount * sets;
    const restTime = Math.max(0, sets - 1) * restSeconds;
    return Math.max(1, Math.round(((workTime + restTime) / 60) * 10) / 10);
  }
  if (reps.includes('-')) {
    const parts = reps.split('-').map(Number);
    repCount = (parts[0] + parts[1]) / 2;
  } else {
    repCount = parseInt(reps) || 10;
  }

  let secondsPerRep = 3;
  if (tempo && tempo.includes('-')) {
    const tParts = tempo.split('-').map(Number);
    const sum = tParts.reduce((a, b) => (isNaN(b) ? a : a + b), 0);
    if (sum > 0) secondsPerRep = sum;
  }

  const workSeconds = repCount * secondsPerRep * sets;
  const restSecondsTotal = Math.max(0, sets - 1) * restSeconds;
  return Math.max(1, Math.round(((workSeconds + restSecondsTotal) / 60) * 10) / 10);
}

/**
 * Build rigorous Time Budget Breakdown
 */
export function computeDayTimeBudget(
  warmup: PrescribedExercise[],
  main: PrescribedExercise[],
  accessory: PrescribedExercise[],
  finisher: PrescribedExercise[] = [],
  targetBudgetMins: number
): TimeBudgetBreakdown {
  const warmupMins = warmup.length === 0 ? 0 : Math.max(2, Math.min(8, warmup.length * 1.5));
  
  let mainMins = 0;
  let restMinsTotal = 0;
  main.forEach(pe => {
    const d = pe.estimated_duration_mins || calculateExerciseDuration(pe.sets, pe.target_reps, pe.rest_seconds, pe.tempo);
    pe.estimated_duration_mins = d;
    mainMins += d;
    restMinsTotal += (pe.sets * pe.rest_seconds) / 60;
  });

  let accMins = 0;
  accessory.forEach(pe => {
    const d = pe.estimated_duration_mins || calculateExerciseDuration(pe.sets, pe.target_reps, pe.rest_seconds, pe.tempo);
    pe.estimated_duration_mins = d;
    accMins += d;
    restMinsTotal += (pe.sets * pe.rest_seconds) / 60;
  });

  let finishMins = 0;
  finisher.forEach(pe => {
    const d = pe.estimated_duration_mins || calculateExerciseDuration(pe.sets, pe.target_reps, pe.rest_seconds, pe.tempo);
    pe.estimated_duration_mins = d;
    finishMins += d;
    restMinsTotal += (pe.sets * pe.rest_seconds) / 60;
  });

  const totalExercises = main.length + accessory.length + finisher.length;
  const transitionMins = Math.max(1, Math.round(totalExercises * 0.7));
  const totalEstimated = Math.round(warmupMins + mainMins + accMins + finishMins + transitionMins);

  return {
    warmup_mins: Math.round(warmupMins),
    main_workout_mins: Math.round(mainMins),
    accessory_mins: Math.round(accMins),
    core_finisher_mins: Math.round(finishMins),
    rest_mins: Math.round(restMinsTotal),
    transition_mins: transitionMins,
    total_estimated_mins: totalEstimated,
    target_budget_mins: targetBudgetMins
  };
}

export function buildDynamicSplitSessions({
  assessment,
  eligiblePool,
  subLevels,
  goalStrategy,
  weekNumber = 1,
  avgFatigueLogged = 5,
  avgRpeLogged = 7
}: SplitBuildParams): WorkoutDay[] {
  const freq = Math.min(6, Math.max(1, assessment.trainingDaysPerWeek || 4));
  const userEquipment = assessment.equipment && assessment.equipment.length > 0 ? assessment.equipment : ['bodyweight'];
  const userEnv = assessment.environment || 'home';
  const rawDuration = assessment.minutesPerSession || 60;

  // Session Time Budget Classifications
  const isShort = rawDuration <= 35;       // 20-30 mins budget
  const isMedium = rawDuration > 35 && rawDuration <= 50; // 45 mins budget
  const isFull = rawDuration > 50 && rawDuration <= 70;   // 60 mins budget
  const isLong = rawDuration > 70;         // 90 mins budget

  // Primary equipment priorities
  const isGym = userEnv === 'gym';
  const isPark = userEnv === 'park';
  const hasBarbell = userEquipment.includes('barbell');
  const hasDumbbells = userEquipment.includes('dumbbells');

  const primaryEq: EquipmentType[] = isGym 
    ? (hasBarbell ? ['barbell', 'gym_machines', 'dumbbells'] : ['gym_machines', 'dumbbells'])
    : isPark 
    ? ['pullup_bar', 'parallel_bars', 'bodyweight']
    : hasDumbbells 
    ? ['dumbbells', 'bodyweight'] 
    : ['bodyweight'];

  // Calculate Base Sets & Reps by Week & Time Tier
  let effectiveTargetSets = goalStrategy.targetSets;
  let effectiveTargetReps = goalStrategy.targetReps;
  let effectiveRest = goalStrategy.restSeconds;
  let effectiveTempo = goalStrategy.tempo;

  if (isShort) {
    effectiveTargetSets = Math.max(2, effectiveTargetSets - 1);
    effectiveRest = Math.min(60, effectiveRest);
  } else if (isLong) {
    effectiveTargetSets = Math.min(4, effectiveTargetSets + 1);
    effectiveRest = Math.max(75, effectiveRest);
  }

  // Week-based Progression Rules (Non-random Training Block)
  let weekThemeTitle = 'هفته ۱: ساخت پایه، تثبیت فرم و ارزیابی اولیه';
  if (weekNumber === 2) {
    weekThemeTitle = 'هفته ۲: اورلود تدریجی (افزایش حجم/تکرار بر اساس توان واقعی)';
    if (effectiveTargetReps === '8-12') effectiveTargetReps = '10-12';
    else if (effectiveTargetReps === '10-12') effectiveTargetReps = '12-15';
    else if (effectiveTargetReps === '4-6') effectiveTargetReps = '5-6';
    effectiveRest = Math.max(45, effectiveRest - 5);
  } else if (weekNumber === 3) {
    weekThemeTitle = 'هفته ۳: اوج چگالی و تنوع در حرکات کمکی';
    if (effectiveTargetReps === '8-12') effectiveTargetReps = '12-15';
    else if (effectiveTargetReps === '10-12') effectiveTargetReps = '14-16';
    if (!isShort) effectiveTargetSets = Math.min(5, effectiveTargetSets + 1);
    effectiveTempo = '3-1-1-0';
    effectiveRest = Math.max(45, effectiveRest - 10);
  } else if (weekNumber === 4) {
    // Adaptive Week 4: Deload if high fatigue, otherwise Peak
    if (avgFatigueLogged >= 7 || avgRpeLogged >= 9 || subLevels.overallLevel === 'beginner') {
      weekThemeTitle = 'هفته ۴: دیلود و ریکاوری مفاصل و سیستم عصبی';
      effectiveTargetSets = Math.max(2, effectiveTargetSets - 1);
      effectiveRest += 20;
      effectiveTargetReps = '8-10';
      effectiveTempo = '2-0-2-0';
    } else {
      weekThemeTitle = 'هفته ۴: تست رکورد شخصی و هایپرتروفی اوج فاز';
      effectiveTargetReps = '6-8';
      effectiveRest += 15;
    }
  }

  // Safe exercise picker with targetGoal scoring
  const pick = (patterns: MovementPattern[], cat?: ExerciseCategory, diff?: FitnessLevel, exclude?: string[]): Exercise => {
    return pickSafeExerciseFromPool(eligiblePool, {
      movementPatterns: patterns,
      categories: cat ? [cat] : undefined,
      difficulty: diff || subLevels.overallLevel,
      priorityEquipment: primaryEq,
      excludedIds: exclude,
      targetGoal: assessment.primaryGoal
    });
  };

  // Warmup builder strictly adhering to time budget
  const getWarmup = (excludeIds: string[] = []): PrescribedExercise[] => {
    if (isShort) {
      // 20-30 min budget: Single ultra-targeted dynamic warmup move (2 mins)
      const w = pickSafeExerciseFromPool(eligiblePool, {
        movementPatterns: ['push_horizontal', 'squat'],
        difficulty: 'beginner',
        excludedIds: excludeIds
      });
      return [
        {
          exercise_id: w.id,
          sets: 1,
          target_reps: '10-12',
          rest_seconds: 30,
          role: 'foundation',
          adaptation_action: 'KEEP',
          estimated_duration_mins: 2,
          notes_fa: 'گرم‌کردن سریع مفاصل و پویایی حرکتی (۲ دقیقه)'
        }
      ];
    }

    // 45 to 90 min budgets: 2 dynamic warmup movements (3-5 mins)
    const w1 = pickSafeExerciseFromPool(eligiblePool, {
      movementPatterns: ['push_horizontal', 'squat', 'hinge'],
      difficulty: 'beginner',
      excludedIds: excludeIds
    });
    const w2 = pickSafeExerciseFromPool(eligiblePool, {
      movementPatterns: ['core_anti_extension', 'hinge', 'lunge'],
      difficulty: 'beginner',
      excludedIds: [...excludeIds, w1.id]
    });

    return [
      {
        exercise_id: w1.id,
        sets: 1,
        target_reps: '10-12',
        rest_seconds: 30,
        role: 'foundation',
        adaptation_action: 'KEEP',
        estimated_duration_mins: 2,
        notes_fa: 'گرم‌کردن مفاصل و آماده‌سازی سیستم عصب-عضله'
      },
      {
        exercise_id: w2.id,
        sets: 1,
        target_reps: '10-12',
        rest_seconds: 30,
        role: 'foundation',
        adaptation_action: 'KEEP',
        estimated_duration_mins: 2,
        notes_fa: 'پویایی ستون فقرات، لگن و افزایش ضربان قلب'
      }
    ];
  };

  // Helper to create prescribed exercise with precise role and duration
  const createPe = (
    ex: Exercise,
    sets: number,
    reps: string,
    rest: number,
    notes: string,
    role: ExerciseRole = 'foundation',
    action: ExerciseAdaptationAction = 'KEEP',
    t?: string
  ): PrescribedExercise => {
    const customTempo = t || effectiveTempo;
    const dur = calculateExerciseDuration(sets, reps, rest, customTempo);
    return {
      exercise_id: ex.id,
      sets,
      target_reps: reps,
      rest_seconds: rest,
      tempo: customTempo,
      role,
      adaptation_action: action,
      notes_fa: notes,
      estimated_duration_mins: dur
    };
  };

  const sessions: WorkoutDay[] = [];

  // =========================================================================
  // 1-DAY SPLIT: FULL BODY
  // =========================================================================
  if (freq === 1) {
    const eSquat = pick(['squat'], 'legs', subLevels.legsLevel);
    const ePushH = pick(['push_horizontal'], 'chest', subLevels.pushLevel, [eSquat.id]);
    const ePullV = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel, [eSquat.id, ePushH.id]);
    const eHinge = pick(['hinge'], 'legs', subLevels.legsLevel, [eSquat.id, ePushH.id, ePullV.id]);
    const ePushV = pick(['push_vertical'], 'shoulders', subLevels.pushLevel, [eSquat.id, ePushH.id, ePullV.id, eHinge.id]);
    const eCore1 = pick(['core_anti_extension', 'core_flexion'], 'core', subLevels.coreLevel, [eSquat.id, ePushH.id, ePullV.id, eHinge.id, ePushV.id]);

    let mainList: PrescribedExercise[] = [];
    let accList: PrescribedExercise[] = [];
    let finishList: PrescribedExercise[] = [];

    if (isShort) {
      // 20-30 min: 3 Core Multi-Joint Movements Only
      mainList = [
        createPe(eSquat, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${eSquat.name_fa}): اسکوات اصلی ران`, 'foundation', 'KEEP'),
        createPe(ePushH, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${ePushH.name_fa}): پرس سینه افقی`, 'foundation', 'KEEP'),
        createPe(ePullV, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${ePullV.name_fa}): کشش عمودی زیربغل`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      // 45 min: 4 Foundation Exercises + 1 Core
      mainList = [
        createPe(eSquat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${eSquat.name_fa}): اسکوات ران`, 'foundation', 'KEEP'),
        createPe(ePushH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${ePushH.name_fa}): پرس سینه افقی`, 'foundation', 'KEEP'),
        createPe(ePullV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${ePullV.name_fa}): کشش عمودی پشت`, 'foundation', 'KEEP'),
        createPe(eHinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۴ (${eHinge.name_fa}): الگوی هیپ‌هینج باسن`, 'foundation', 'KEEP')
      ];
      accList = [
        createPe(eCore1, 2, '30s', 45, `حرکت ۵ (${eCore1.name_fa}): ثبات شکم و ستون فقرات`, 'core', 'KEEP')
      ];
    } else {
      // 60-90 min: Comprehensive Full Body
      mainList = [
        createPe(eSquat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${eSquat.name_fa}): اسکوات اصلی برای توان پا`, 'foundation', 'KEEP'),
        createPe(ePushH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${ePushH.name_fa}): پرس سینه با کنترل منفی`, 'foundation', 'KEEP'),
        createPe(ePullV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${ePullV.name_fa}): بارفیکس / کشش عمودی`, 'foundation', 'KEEP'),
        createPe(eHinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۴ (${eHinge.name_fa}): ددلیفت / پل سرینی`, 'foundation', 'KEEP'),
        createPe(ePushV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۵ (${ePushV.name_fa}): پرس سرشانه عمودی`, 'progression', 'PROGRESS')
      ];
      accList = [
        createPe(eCore1, 3, '40s', 45, `حرکت ۶ (${eCore1.name_fa}): ثبات عمیق مرکز بدن`, 'core', 'KEEP')
      ];
      if (isLong) {
        const eCalf = pick(['squat', 'lunge'], 'calves', 'beginner', [eSquat.id, eHinge.id]);
        finishList = [
          createPe(eCalf, 3, '15-20', 45, `حرکت ۷ (${eCalf.name_fa}): تقویت ساق و پایداری مچ پا`, 'accessory', 'ADD')
        ];
      }
    }

    const warmup = getWarmup([eSquat.id, ePushH.id]);
    const budget = computeDayTimeBudget(warmup, mainList, accList, finishList, rawDuration);

    sessions.push({
      day_number: 1,
      title_fa: 'جلسه فول بادی هدفمند (Full Body Engine)',
      title_en: 'Day 1: Full Body Targeted',
      focus_fa: 'تحریک متوازن الگوهای حرکتی اصلی بدن بر اساس بودجه زمانی مشخص',
      estimated_duration_mins: budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: budget,
      week_theme_fa: weekThemeTitle,
      warmup,
      main_workout: mainList,
      accessory: accList,
      finisher: finishList
    });
  }

  // =========================================================================
  // 2-DAY SPLIT: FULL BODY A & B
  // =========================================================================
  else if (freq === 2) {
    // Day 1
    const d1Squat = pick(['squat'], 'legs', subLevels.legsLevel);
    const d1PushH = pick(['push_horizontal'], 'chest', subLevels.pushLevel);
    const d1PullV = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel);
    const d1Lunge = pick(['lunge', 'squat'], 'legs', subLevels.legsLevel, [d1Squat.id]);
    const d1Core = pick(['core_anti_extension', 'core_flexion'], 'core', subLevels.coreLevel);

    let d1Main: PrescribedExercise[] = [];
    let d1Acc: PrescribedExercise[] = [];
    let d1Fin: PrescribedExercise[] = [];

    if (isShort) {
      d1Main = [
        createPe(d1Squat, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1Squat.name_fa}): اسکوات اصلی ران`, 'foundation', 'KEEP'),
        createPe(d1PushH, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1PushH.name_fa}): پرس سینه افقی`, 'foundation', 'KEEP'),
        createPe(d1PullV, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1PullV.name_fa}): کشش عمودی پشت`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d1Main = [
        createPe(d1Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1Squat.name_fa}): اسکوات ران`, 'foundation', 'KEEP'),
        createPe(d1PushH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1PushH.name_fa}): پرس سینه`, 'foundation', 'KEEP'),
        createPe(d1PullV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1PullV.name_fa}): کشش عمودی پشت`, 'foundation', 'KEEP')
      ];
      d1Acc = [
        createPe(d1Lunge, 2, '10-12', 45, `حرکت ۴ (${d1Lunge.name_fa}): لانژ تک‌پایی برای تعادل عضلانی`, 'accessory', weekNumber >= 3 ? 'REPLACE' : 'KEEP')
      ];
    } else {
      const d1Arm = pick(['push_horizontal', 'push_vertical'], 'arms', subLevels.overallLevel);
      d1Main = [
        createPe(d1Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1Squat.name_fa}): اسکوات اصلی`, 'foundation', 'KEEP'),
        createPe(d1PushH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1PushH.name_fa}): پرس سینه افقی`, 'foundation', 'KEEP'),
        createPe(d1PullV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1PullV.name_fa}): کشش عمودی زیربغل`, 'foundation', 'KEEP'),
        createPe(d1Lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d1Lunge.name_fa}): لانژ تک‌پایی ران`, 'progression', 'PROGRESS')
      ];
      d1Acc = [
        createPe(d1Arm, 3, '10-12', 45, `حرکت ۵ (${d1Arm.name_fa}): پشت‌بازو و ثبات آرنج`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP'),
        createPe(d1Core, 3, '40s', 45, `حرکت ۶ (${d1Core.name_fa}): پلانک ثبات ستون فقرات`, 'core', 'KEEP')
      ];
      if (isLong) {
        const d1Metabolic = pick(['core_flexion', 'cardio'], undefined, 'beginner', [d1Core.id]);
        d1Fin = [
          createPe(d1Metabolic, 3, '20', 45, `حرکت ۷ (${d1Metabolic.name_fa}): فینیشر متابولیک و چربی‌سوزی`, 'finisher', 'ADD')
        ];
      }
    }

    const d1Warmup = getWarmup([d1Squat.id, d1PushH.id]);
    const d1Budget = computeDayTimeBudget(d1Warmup, d1Main, d1Acc, d1Fin, rawDuration);

    sessions.push({
      day_number: 1,
      title_fa: 'جلسه اول: فول بادی A (سینه، ران و کشش عمودی)',
      title_en: 'Day 1: Full Body A',
      focus_fa: 'توسعه قدرت سینه، جلوی ران و پهنای پشت متناسب با زمان جلسه',
      estimated_duration_mins: d1Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d1Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d1Warmup,
      main_workout: d1Main,
      accessory: d1Acc,
      finisher: d1Fin
    });

    // Day 2
    const d2Hinge = pick(['hinge'], 'legs', subLevels.legsLevel);
    const d2PushV = pick(['push_vertical'], 'shoulders', subLevels.pushLevel);
    const d2PullH = pick(['pull_horizontal'], 'back', subLevels.pullLevel);
    const d2CoreFlex = pick(['core_flexion'], 'core', subLevels.coreLevel);

    let d2Main: PrescribedExercise[] = [];
    let d2Acc: PrescribedExercise[] = [];
    let d2Fin: PrescribedExercise[] = [];

    if (isShort) {
      d2Main = [
        createPe(d2Hinge, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Hinge.name_fa}): ددلیفت / پل سرینی`, 'foundation', 'KEEP'),
        createPe(d2PushV, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2PushV.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP'),
        createPe(d2PullH, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2PullH.name_fa}): روینگ افقی پشت`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d2Main = [
        createPe(d2Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Hinge.name_fa}): پل سرینی / ددلیفت`, 'foundation', 'KEEP'),
        createPe(d2PushV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2PushV.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP'),
        createPe(d2PullH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2PullH.name_fa}): روینگ افقی برای ضخامت پشت`, 'foundation', 'KEEP')
      ];
      d2Acc = [
        createPe(d2CoreFlex, 2, '12-15', 45, `حرکت ۴ (${d2CoreFlex.name_fa}): انقباض شکم`, 'core', 'KEEP')
      ];
    } else {
      const d2PushSec = pick(['push_horizontal'], 'chest', subLevels.pushLevel, [d1PushH.id]);
      const d2CoreRot = pick(['core_rotational', 'core_lateral'], 'core', subLevels.coreLevel);
      d2Main = [
        createPe(d2Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Hinge.name_fa}): ددلیفت / پل سرینی باسن`, 'foundation', 'KEEP'),
        createPe(d2PushV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2PushV.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP'),
        createPe(d2PullH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2PullH.name_fa}): روینگ افقی پشت`, 'foundation', 'KEEP'),
        createPe(d2PushSec, effectiveTargetSets - 1, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d2PushSec.name_fa}): تمرین تکمیلی سینه`, 'progression', 'PROGRESS')
      ];
      d2Acc = [
        createPe(d2CoreFlex, 3, '12-15', 45, `حرکت ۵ (${d2CoreFlex.name_fa}): تقویت شکم`, 'core', 'KEEP'),
        createPe(d2CoreRot, 3, '30s', 45, `حرکت ۶ (${d2CoreRot.name_fa}): ثبات پهلو و عضلات مورب`, 'core', weekNumber === 3 ? 'REPLACE' : 'KEEP')
      ];
      if (isLong) {
        const d2Calf = pick(['squat', 'lunge'], 'calves', 'beginner');
        d2Fin = [
          createPe(d2Calf, 3, '15-20', 45, `حرکت ۷ (${d2Calf.name_fa}): تقویت عضلات ساق پا`, 'accessory', 'ADD')
        ];
      }
    }

    const d2Warmup = getWarmup([d2Hinge.id, d2PushV.id]);
    const d2Budget = computeDayTimeBudget(d2Warmup, d2Main, d2Acc, d2Fin, rawDuration);

    sessions.push({
      day_number: 2,
      title_fa: 'جلسه دوم: فول بادی B (سرشانه، همسترینگ و ضخامت پشت)',
      title_en: 'Day 2: Full Body B',
      focus_fa: 'توسعه زنجیره خلفی (باسن، همسترینگ)، سرشانه و عضلات میانی پشت',
      estimated_duration_mins: d2Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d2Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d2Warmup,
      main_workout: d2Main,
      accessory: d2Acc,
      finisher: d2Fin
    });
  }

  // =========================================================================
  // 3-DAY SPLIT: PUSH / PULL / LEGS HYBRID
  // =========================================================================
  else if (freq === 3) {
    // Day 1: Push
    const d1Push1 = pick(['push_horizontal'], 'chest', subLevels.pushLevel);
    const d1Squat = pick(['squat'], 'legs', subLevels.legsLevel);
    const d1Push2 = pick(['push_vertical'], 'shoulders', subLevels.pushLevel);
    const d1Arm = pick(['push_horizontal', 'push_vertical'], 'arms', subLevels.overallLevel);
    const d1Core = pick(['core_anti_extension'], 'core', subLevels.coreLevel);

    let d1Main: PrescribedExercise[] = [];
    let d1Acc: PrescribedExercise[] = [];
    let d1Fin: PrescribedExercise[] = [];

    if (isShort) {
      d1Main = [
        createPe(d1Push1, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1Push1.name_fa}): پرس سینه اصلی`, 'foundation', 'KEEP'),
        createPe(d1Squat, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1Squat.name_fa}): اسکوات اصلی ران`, 'foundation', 'KEEP'),
        createPe(d1Push2, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1Push2.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d1Main = [
        createPe(d1Push1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1Push1.name_fa}): پرس سینه اصلی`, 'foundation', 'KEEP'),
        createPe(d1Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1Squat.name_fa}): اسکوات اصلی ران`, 'foundation', 'KEEP'),
        createPe(d1Push2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1Push2.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP')
      ];
      d1Acc = [
        createPe(d1Arm, 2, '10-12', 45, `حرکت ۴ (${d1Arm.name_fa}): پشت‌بازو تمرکزی`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP')
      ];
    } else {
      const d1Push3 = pick(['push_horizontal'], 'chest', subLevels.pushLevel, [d1Push1.id]);
      d1Main = [
        createPe(d1Push1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1Push1.name_fa}): پرس سینه با کنترل منفی`, 'foundation', 'KEEP'),
        createPe(d1Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1Squat.name_fa}): اسکوات برای تقویت ران`, 'foundation', 'KEEP'),
        createPe(d1Push2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1Push2.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP'),
        createPe(d1Push3, effectiveTargetSets - 1, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d1Push3.name_fa}): بالا سینه تکمیلی`, 'progression', 'PROGRESS')
      ];
      d1Acc = [
        createPe(d1Arm, 3, '10-12', 45, `حرکت ۵ (${d1Arm.name_fa}): پشت‌بازو الماسی / سیم‌کش`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP'),
        createPe(d1Core, 3, '40s', 45, `حرکت ۶ (${d1Core.name_fa}): پلانک ثبات ستون فقرات`, 'core', 'KEEP')
      ];
      if (isLong) {
        const d1Metabolic = pick(['core_flexion', 'cardio'], undefined, 'beginner', [d1Core.id]);
        d1Fin = [
          createPe(d1Metabolic, 3, '20', 45, `حرکت ۷ (${d1Metabolic.name_fa}): چربی‌سوزی و استقامت قلبی`, 'finisher', 'ADD')
        ];
      }
    }

    const d1Warmup = getWarmup([d1Push1.id, d1Squat.id]);
    const d1Budget = computeDayTimeBudget(d1Warmup, d1Main, d1Acc, d1Fin, rawDuration);

    sessions.push({
      day_number: 1,
      title_fa: 'روز ۱: پوش و جلوی ران (تمرکز بر سینه، سرشانه و چهارسر)',
      title_en: 'Day 1: Push & Quad Dominant',
      focus_fa: 'توسعه عضلات سینه، دلتوئید قدامی، چهارسر ران و پشت بازو',
      estimated_duration_mins: d1Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d1Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d1Warmup,
      main_workout: d1Main,
      accessory: d1Acc,
      finisher: d1Fin
    });

    // Day 2: Pull Focus
    const d2Pull1 = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel);
    const d2Hinge = pick(['hinge'], 'legs', subLevels.legsLevel);
    const d2Pull2 = pick(['pull_horizontal', 'pull_vertical'], 'back', subLevels.pullLevel, [d2Pull1.id]);
    const d2ShoulderPost = pick(['pull_horizontal', 'push_vertical'], 'shoulders', subLevels.overallLevel);
    const d2Core = pick(['core_flexion'], 'core', subLevels.coreLevel);

    let d2Main: PrescribedExercise[] = [];
    let d2Acc: PrescribedExercise[] = [];
    let d2Fin: PrescribedExercise[] = [];

    if (isShort) {
      d2Main = [
        createPe(d2Pull1, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Pull1.name_fa}): کشش عمودی V-Shape`, 'foundation', 'KEEP'),
        createPe(d2Hinge, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2Hinge.name_fa}): ددلیفت / پل سرینی`, 'foundation', 'KEEP'),
        createPe(d2Pull2, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2Pull2.name_fa}): روینگ افقی پشت`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d2Main = [
        createPe(d2Pull1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Pull1.name_fa}): کشش عمودی زیربغل`, 'foundation', 'KEEP'),
        createPe(d2Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2Hinge.name_fa}): ددلیفت / پل باسن`, 'foundation', 'KEEP'),
        createPe(d2Pull2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2Pull2.name_fa}): روینگ افقی پشت`, 'foundation', 'KEEP')
      ];
      d2Acc = [
        createPe(d2ShoulderPost, 2, '12-15', 45, `حرکت ۴ (${d2ShoulderPost.name_fa}): دلتوئید خلفی و سلامت شانه`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP')
      ];
    } else {
      const d2Pull3 = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel, [d2Pull1.id, d2Pull2.id]);
      d2Main = [
        createPe(d2Pull1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Pull1.name_fa}): کشش عمودی برای پهنای V-Shape`, 'foundation', 'KEEP'),
        createPe(d2Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2Hinge.name_fa}): ددلیفت برای زنجیره خلفی`, 'foundation', 'KEEP'),
        createPe(d2Pull2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2Pull2.name_fa}): روینگ افقی ضخامت پشت`, 'foundation', 'KEEP'),
        createPe(d2Pull3, effectiveTargetSets - 1, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d2Pull3.name_fa}): حرکت تکمیلی پشت و بازو`, 'progression', 'PROGRESS')
      ];
      d2Acc = [
        createPe(d2ShoulderPost, 3, '12-15', 45, `حرکت ۵ (${d2ShoulderPost.name_fa}): دلتوئید خلفی`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP'),
        createPe(d2Core, 3, '12-15', 45, `حرکت ۶ (${d2Core.name_fa}): کرانچ تمرکزی شکم`, 'core', 'KEEP')
      ];
      if (isLong) {
        const d2CoreRot = pick(['core_rotational', 'core_lateral'], 'core', subLevels.coreLevel);
        d2Fin = [
          createPe(d2CoreRot, 3, '30s', 45, `حرکت ۷ (${d2CoreRot.name_fa}): چرخش روسی برای پهلوها`, 'finisher', 'ADD')
        ];
      }
    }

    const d2Warmup = getWarmup([d2Pull1.id, d2Hinge.id]);
    const d2Budget = computeDayTimeBudget(d2Warmup, d2Main, d2Acc, d2Fin, rawDuration);

    sessions.push({
      day_number: 2,
      title_fa: 'روز ۲: پول و زنجیره خلفی (تمرکز بر زیربغل، عضلات پشت و باسن)',
      title_en: 'Day 2: Pull & Posterior Chain',
      focus_fa: 'توسعه پهنای V-Shape، ضخامت کمر، جلوبازو و همسترینگ',
      estimated_duration_mins: d2Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d2Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d2Warmup,
      main_workout: d2Main,
      accessory: d2Acc,
      finisher: d2Fin
    });

    // Day 3: Legs & Core Power
    const d3Squat = pick(['squat'], 'legs', subLevels.legsLevel, [d1Squat.id]);
    const d3Lunge = pick(['lunge'], 'legs', subLevels.legsLevel);
    const d3PushSec = pick(['push_horizontal'], 'chest', subLevels.pushLevel, [d1Push1.id]);
    const d3Calf = pick(['squat', 'lunge'], 'calves', 'beginner');
    const d3Core = pick(['core_anti_extension', 'core_flexion'], 'core', subLevels.coreLevel);

    let d3Main: PrescribedExercise[] = [];
    let d3Acc: PrescribedExercise[] = [];
    let d3Fin: PrescribedExercise[] = [];

    if (isShort) {
      d3Main = [
        createPe(d3Squat, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d3Squat.name_fa}): اسکوات پا`, 'foundation', 'KEEP'),
        createPe(d3Lunge, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d3Lunge.name_fa}): لانژ تک‌پایی`, 'foundation', 'KEEP'),
        createPe(d3PushSec, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d3PushSec.name_fa}): شنا / پرس سینه تکمیلی`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d3Main = [
        createPe(d3Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d3Squat.name_fa}): اسکوات پایین‌تنه`, 'foundation', 'KEEP'),
        createPe(d3Lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d3Lunge.name_fa}): لانژ تک‌پایی`, 'foundation', 'KEEP'),
        createPe(d3PushSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d3PushSec.name_fa}): پرس سینه تکمیلی`, 'foundation', 'KEEP')
      ];
      d3Acc = [
        createPe(d3Core, 2, '40s', 45, `حرکت ۴ (${d3Core.name_fa}): پلانک ثبات تنه`, 'core', 'KEEP')
      ];
    } else {
      const d3HingeSec = pick(['hinge'], 'legs', subLevels.legsLevel, [d2Hinge.id]);
      d3Main = [
        createPe(d3Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d3Squat.name_fa}): اسکوات قدرتی`, 'foundation', 'KEEP'),
        createPe(d3Lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d3Lunge.name_fa}): لانژ تک‌پایی برای تقارن`, 'foundation', 'KEEP'),
        createPe(d3HingeSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d3HingeSec.name_fa}): پل باسن تک‌پا`, 'progression', 'PROGRESS'),
        createPe(d3PushSec, effectiveTargetSets - 1, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d3PushSec.name_fa}): شنا سوئدی / پرس سینه`, 'progression', 'PROGRESS')
      ];
      d3Acc = [
        createPe(d3Calf, 3, '15-20', 45, `حرکت ۵ (${d3Calf.name_fa}): ساق پا ایستاده`, 'accessory', 'KEEP'),
        createPe(d3Core, 3, '45s', 45, `حرکت ۶ (${d3Core.name_fa}): پلانک عمیق`, 'core', 'KEEP')
      ];
      if (isLong) {
        const d3FinEx = pick(['core_rotational', 'cardio'], undefined, 'beginner');
        d3Fin = [
          createPe(d3FinEx, 3, '20', 45, `حرکت ۷ (${d3FinEx.name_fa}): فینیشر استقامتی عضلات مرکزی`, 'finisher', 'ADD')
        ];
      }
    }

    const d3Warmup = getWarmup([d3Squat.id, d3Lunge.id]);
    const d3Budget = computeDayTimeBudget(d3Warmup, d3Main, d3Acc, d3Fin, rawDuration);

    sessions.push({
      day_number: 3,
      title_fa: 'روز ۳: پا، عضلات مرکزی و هایپرتروفی (Legs & Core Dynamic)',
      title_en: 'Day 3: Legs & Core Dynamic',
      focus_fa: 'تکمیل حجم هفتگی پاها، رفع عدم تقارن عضلانی و استحکام هسته مرکزی بدن',
      estimated_duration_mins: d3Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d3Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d3Warmup,
      main_workout: d3Main,
      accessory: d3Acc,
      finisher: d3Fin
    });
  }

  // =========================================================================
  // 4-DAY SPLIT: UPPER / LOWER / UPPER / LOWER
  // =========================================================================
  else if (freq === 4) {
    // Upper 1
    const d1PushH = pick(['push_horizontal'], 'chest', subLevels.pushLevel);
    const d1PullV = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel);
    const d1PushV = pick(['push_vertical'], 'shoulders', subLevels.pushLevel);
    const d1PullH = pick(['pull_horizontal', 'pull_vertical'], 'back', subLevels.pullLevel, [d1PullV.id]);
    const d1Arm = pick(['push_horizontal', 'push_vertical'], 'arms', subLevels.overallLevel);
    const d1Core = pick(['core_anti_extension'], 'core', subLevels.coreLevel);

    let d1Main: PrescribedExercise[] = [];
    let d1Acc: PrescribedExercise[] = [];
    let d1Fin: PrescribedExercise[] = [];

    if (isShort) {
      d1Main = [
        createPe(d1PushH, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1PushH.name_fa}): پرس سینه اصلی`, 'foundation', 'KEEP'),
        createPe(d1PullV, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1PullV.name_fa}): کشش عمودی پشت`, 'foundation', 'KEEP'),
        createPe(d1PushV, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1PushV.name_fa}): پرس سرشانه`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d1Main = [
        createPe(d1PushH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1PushH.name_fa}): پرس سینه اصلی`, 'foundation', 'KEEP'),
        createPe(d1PullV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1PullV.name_fa}): کشش عمودی زیربغل`, 'foundation', 'KEEP'),
        createPe(d1PushV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1PushV.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP')
      ];
      d1Acc = [
        createPe(d1PullH, 2, '10-12', 45, `حرکت ۴ (${d1PullH.name_fa}): روینگ افقی پشت`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP')
      ];
    } else {
      d1Main = [
        createPe(d1PushH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d1PushH.name_fa}): پرس سینه قدرتی`, 'foundation', 'KEEP'),
        createPe(d1PullV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d1PullV.name_fa}): کشش عمودی V-Shape`, 'foundation', 'KEEP'),
        createPe(d1PushV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d1PushV.name_fa}): پرس سرشانه`, 'foundation', 'KEEP'),
        createPe(d1PullH, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d1PullH.name_fa}): روینگ افقی ضخامت پشت`, 'progression', 'PROGRESS')
      ];
      d1Acc = [
        createPe(d1Arm, 3, '10-12', 45, `حرکت ۵ (${d1Arm.name_fa}): پشت‌بازو تمرکزی`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP'),
        createPe(d1Core, 3, '40s', 45, `حرکت ۶ (${d1Core.name_fa}): پلانک ساعد`, 'core', 'KEEP')
      ];
      if (isLong) {
        const d1Metabolic = pick(['core_flexion', 'cardio'], undefined, 'beginner', [d1Core.id]);
        d1Fin = [
          createPe(d1Metabolic, 3, '20', 45, `حرکت ۷ (${d1Metabolic.name_fa}): کوه‌نورد شکم و استقامت متابولیک`, 'finisher', 'ADD')
        ];
      }
    }

    const d1Warmup = getWarmup([d1PushH.id, d1PullV.id]);
    const d1Budget = computeDayTimeBudget(d1Warmup, d1Main, d1Acc, d1Fin, rawDuration);

    sessions.push({
      day_number: 1,
      title_fa: 'روز ۱: بالاتنه قدرتی A (سینه، پشت و سرشانه سنگین)',
      title_en: 'Day 1: Upper Body Power',
      focus_fa: 'افزایش قدرت مکانیکی و بارگذاری روی عضلات سینه، زیربغل و سرشانه',
      estimated_duration_mins: d1Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d1Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d1Warmup,
      main_workout: d1Main,
      accessory: d1Acc,
      finisher: d1Fin
    });

    // Lower 1
    const d2Squat = pick(['squat'], 'legs', subLevels.legsLevel);
    const d2Lunge = pick(['lunge', 'squat'], 'legs', subLevels.legsLevel, [d2Squat.id]);
    const d2Hinge = pick(['hinge'], 'legs', subLevels.legsLevel);
    const d2Calf = pick(['squat', 'lunge'], 'calves', 'beginner');
    const d2Core = pick(['core_flexion'], 'core', subLevels.coreLevel);

    let d2Main: PrescribedExercise[] = [];
    let d2Acc: PrescribedExercise[] = [];
    let d2Fin: PrescribedExercise[] = [];

    if (isShort) {
      d2Main = [
        createPe(d2Squat, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Squat.name_fa}): اسکوات پا`, 'foundation', 'KEEP'),
        createPe(d2Lunge, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2Lunge.name_fa}): لانژ تک‌پایی`, 'foundation', 'KEEP'),
        createPe(d2Hinge, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2Hinge.name_fa}): پل باسن`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d2Main = [
        createPe(d2Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Squat.name_fa}): اسکوات اصلی پا`, 'foundation', 'KEEP'),
        createPe(d2Lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2Lunge.name_fa}): لانژ تک‌پایی ران`, 'foundation', 'KEEP'),
        createPe(d2Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2Hinge.name_fa}): پل سرینی / ددلیفت`, 'foundation', 'KEEP')
      ];
      d2Acc = [
        createPe(d2Calf, 2, '15-20', 45, `حرکت ۴ (${d2Calf.name_fa}): ساق پا ایستاده`, 'accessory', 'KEEP')
      ];
    } else {
      const d2SquatSec = pick(['squat'], 'legs', subLevels.legsLevel, [d2Squat.id, d2Lunge.id]);
      d2Main = [
        createPe(d2Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d2Squat.name_fa}): اسکوات چهارسر ران`, 'foundation', 'KEEP'),
        createPe(d2Lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d2Lunge.name_fa}): لانژ تک‌پایی`, 'foundation', 'KEEP'),
        createPe(d2SquatSec, effectiveTargetSets - 1, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d2SquatSec.name_fa}): اسکوات تکمیلی دامنه کامل`, 'progression', 'PROGRESS'),
        createPe(d2Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d2Hinge.name_fa}): پل باسن استحکام خلفی`, 'foundation', 'KEEP')
      ];
      d2Acc = [
        createPe(d2Calf, 3, '15-20', 45, `حرکت ۵ (${d2Calf.name_fa}): ساق پا ایستاده`, 'accessory', 'KEEP'),
        createPe(d2Core, 3, '12-15', 45, `حرکت ۶ (${d2Core.name_fa}): کرانچ مستقیم شکم`, 'core', 'KEEP')
      ];
      if (isLong) {
        const d2Core2 = pick(['core_rotational', 'core_lateral'], 'core', subLevels.coreLevel);
        d2Fin = [
          createPe(d2Core2, 3, '30s', 45, `حرکت ۷ (${d2Core2.name_fa}): پلانک پهلو برای ثبات لگن`, 'finisher', 'ADD')
        ];
      }
    }

    const d2Warmup = getWarmup([d2Squat.id, d2Hinge.id]);
    const d2Budget = computeDayTimeBudget(d2Warmup, d2Main, d2Acc, d2Fin, rawDuration);

    sessions.push({
      day_number: 2,
      title_fa: 'روز ۲: پایین‌تنه قدرتی A (چهارسر ران، باسن و ثبات زانو)',
      title_en: 'Day 2: Lower Body Quads & Glutes',
      focus_fa: 'حجم و قدرت چهارسر ران، اسکوات و هایپرتروفی عضلات سرینی',
      estimated_duration_mins: d2Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d2Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d2Warmup,
      main_workout: d2Main,
      accessory: d2Acc,
      finisher: d2Fin
    });

    // Upper 2
    const d3PushSec = pick(['push_horizontal'], 'chest', subLevels.pushLevel, [d1PushH.id]);
    const d3PullSec = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel, [d1PullV.id]);
    const d3PushV2 = pick(['push_vertical'], 'shoulders', subLevels.pushLevel, [d1PushV.id]);
    const d3PullH2 = pick(['pull_horizontal'], 'back', subLevels.pullLevel, [d1PullH.id]);
    const d3ShoulderPost = pick(['pull_horizontal', 'push_vertical'], 'shoulders', subLevels.overallLevel);

    let d3Main: PrescribedExercise[] = [];
    let d3Acc: PrescribedExercise[] = [];
    let d3Fin: PrescribedExercise[] = [];

    if (isShort) {
      d3Main = [
        createPe(d3PushSec, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d3PushSec.name_fa}): شنا شیب‌دار / بالا سینه`, 'foundation', 'KEEP'),
        createPe(d3PullSec, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d3PullSec.name_fa}): کشش عمودی / چین‌آپ`, 'foundation', 'KEEP'),
        createPe(d3PushV2, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d3PushV2.name_fa}): پرس سرشانه هایپرتروفی`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d3Main = [
        createPe(d3PushSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d3PushSec.name_fa}): پرس بالا سینه`, 'foundation', 'KEEP'),
        createPe(d3PullSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d3PullSec.name_fa}): کشش عمودی پشت`, 'foundation', 'KEEP'),
        createPe(d3PushV2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d3PushV2.name_fa}): سرشانه هایپرتروفی`, 'foundation', 'KEEP')
      ];
      d3Acc = [
        createPe(d3ShoulderPost, 2, '12-15', 45, `حرکت ۴ (${d3ShoulderPost.name_fa}): دلتوئید خلفی`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP')
      ];
    } else {
      d3Main = [
        createPe(d3PushSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d3PushSec.name_fa}): پرس بالا سینه / شنا شیب‌دار`, 'foundation', 'KEEP'),
        createPe(d3PullSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d3PullSec.name_fa}): کشش عمودی / چین‌آپ برای لت`, 'foundation', 'KEEP'),
        createPe(d3PushV2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d3PushV2.name_fa}): پرس سرشانه هایپرتروفی`, 'foundation', 'KEEP'),
        createPe(d3PullH2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d3PullH2.name_fa}): کشش افقی انقباض میانی پشت`, 'progression', 'PROGRESS')
      ];
      d3Acc = [
        createPe(d3ShoulderPost, 3, '12-15', 45, `حرکت ۵ (${d3ShoulderPost.name_fa}): دلتوئید خلفی و سلامت شانه`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP'),
        createPe(pick(['core_anti_extension', 'core_flexion'], 'core', subLevels.coreLevel), 3, '40s', 45, 'حرکت ۶: هالو بادی ثبات کور', 'core', 'KEEP')
      ];
      if (isLong) {
        const d3Core2 = pick(['core_rotational'], 'core', subLevels.coreLevel);
        d3Fin = [
          createPe(d3Core2, 3, '20', 45, `حرکت ۷ (${d3Core2.name_fa}): چرخش روسی برای پهلوها`, 'finisher', 'ADD')
        ];
      }
    }

    const d3Warmup = getWarmup([d3PushSec.id, d3PullSec.id]);
    const d3Budget = computeDayTimeBudget(d3Warmup, d3Main, d3Acc, d3Fin, rawDuration);

    sessions.push({
      day_number: 3,
      title_fa: 'روز ۳: بالاتنه هایپرتروفی B (تفکیک عضلانی، بالای سینه و بازوها)',
      title_en: 'Day 3: Upper Body Hypertrophy',
      focus_fa: 'افزایش حجم، پمپ خونی، بالای سینه، جلوبازو و دلتوئید جانبی',
      estimated_duration_mins: d3Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d3Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d3Warmup,
      main_workout: d3Main,
      accessory: d3Acc,
      finisher: d3Fin
    });

    // Lower 2
    const d4Hinge = pick(['hinge'], 'legs', subLevels.legsLevel);
    const d4Lunge = pick(['lunge'], 'legs', subLevels.legsLevel, [d2Lunge.id]);
    const d4Squat = pick(['squat'], 'legs', subLevels.legsLevel, [d2Squat.id]);
    const d4Calf = pick(['squat', 'lunge'], 'calves', 'beginner');

    let d4Main: PrescribedExercise[] = [];
    let d4Acc: PrescribedExercise[] = [];
    let d4Fin: PrescribedExercise[] = [];

    if (isShort) {
      d4Main = [
        createPe(d4Hinge, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d4Hinge.name_fa}): ددلیفت رومانیایی`, 'foundation', 'KEEP'),
        createPe(d4Lunge, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d4Lunge.name_fa}): اسکوات بلغاری تک‌پا`, 'foundation', 'KEEP'),
        createPe(d4Squat, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d4Squat.name_fa}): اسکوات پا`, 'foundation', 'KEEP')
      ];
    } else if (isMedium) {
      d4Main = [
        createPe(d4Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d4Hinge.name_fa}): ددلیفت رومانیایی`, 'foundation', 'KEEP'),
        createPe(d4Lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d4Lunge.name_fa}): لانژ بلغاری تک‌پا`, 'foundation', 'KEEP'),
        createPe(d4Squat, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d4Squat.name_fa}): اسکوات پا`, 'foundation', 'KEEP')
      ];
      d4Acc = [
        createPe(d4Calf, 2, '15-20', 45, `حرکت ۴ (${d4Calf.name_fa}): ساق پا با مکث در اوج`, 'accessory', 'KEEP')
      ];
    } else {
      const d4HingeSec = pick(['hinge', 'squat'], 'legs', subLevels.legsLevel, [d4Hinge.id]);
      d4Main = [
        createPe(d4Hinge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${d4Hinge.name_fa}): ددلیفت رومانیایی / کشش همسترینگ`, 'foundation', 'KEEP'),
        createPe(d4Lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${d4Lunge.name_fa}): اسکوات بلغاری تک‌پا برای باسن`, 'foundation', 'KEEP'),
        createPe(d4HingeSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${d4HingeSec.name_fa}): پل باسن تک‌پا انقباض ایزوله`, 'progression', 'PROGRESS'),
        createPe(d4Squat, effectiveTargetSets - 1, effectiveTargetReps, effectiveRest, `حرکت ۴ (${d4Squat.name_fa}): اسکوات تکمیلی حجم پا`, 'progression', 'PROGRESS')
      ];
      d4Acc = [
        createPe(d4Calf, 3, '15-20', 45, `حرکت ۵ (${d4Calf.name_fa}): ساق پا با مکث در اوج`, 'accessory', 'KEEP'),
        createPe(pick(['core_flexion', 'core_anti_extension'], 'core', subLevels.coreLevel), 3, '12-15', 45, 'حرکت ۶: زیرشکم / کرانچ عمیق', 'core', 'KEEP')
      ];
      if (isLong) {
        const d4Core2 = pick(['core_anti_extension'], 'core', subLevels.coreLevel);
        d4Fin = [
          createPe(d4Core2, 3, '45s', 45, `حرکت ۷ (${d4Core2.name_fa}): پلانک نهایی ثبات ستون فقرات`, 'finisher', 'ADD')
        ];
      }
    }

    const d4Warmup = getWarmup([d4Hinge.id, d4Squat.id]);
    const d4Budget = computeDayTimeBudget(d4Warmup, d4Main, d4Acc, d4Fin, rawDuration);

    sessions.push({
      day_number: 4,
      title_fa: 'روز ۴: پایین‌تنه B (همسترینگ، باسن تک‌پا و استحکام کور)',
      title_en: 'Day 4: Lower Body Posterior Chain',
      focus_fa: 'توسعه تخصصی همسترینگ، عضلات سرینی و تعادل مفصل ران',
      estimated_duration_mins: d4Budget.total_estimated_mins,
      intensity_level: isShort ? 'moderate' : 'high',
      time_budget_breakdown: d4Budget,
      week_theme_fa: weekThemeTitle,
      warmup: d4Warmup,
      main_workout: d4Main,
      accessory: d4Acc,
      finisher: d4Fin
    });
  }

  // =========================================================================
  // 5-DAY SPLIT: PUSH / PULL / LEGS / UPPER / LOWER
  // =========================================================================
  else if (freq === 5) {
    const splitTitles = [
      { title_fa: 'روز ۱: پوش قدرتی (سینه، سرشانه و پشت‌بازو)', title_en: 'Day 1: Push Power', focus: 'افزایش قدرت عضلات سینه، دلتوئید قدامی و سه سر بازویی' },
      { title_fa: 'روز ۲: پول قدرتی (زیربغل، پهنای V-Shape و جلوبازو)', title_en: 'Day 2: Pull Power', focus: 'توسعه قدرت کششی عمودی، پهنای لت و ضخامت عضلات پشت' },
      { title_fa: 'روز ۳: لگز قدرتی (چهارسر ران، باسن و ساق)', title_en: 'Day 3: Legs Dominance', focus: 'بارگذاری سنگین روی عضلات ران، اسکوات عمیق و توان پایین‌تنه' },
      { title_fa: 'روز ۴: بالاتنه هایپرتروفی (پمپ عضلانی و تفکیک شانه و بازو)', title_en: 'Day 4: Upper Hypertrophy', focus: 'حجم عضلانی، انقباض تمرکزی، بالای سینه و دلتوئید جانبی' },
      { title_fa: 'روز ۵: پایین‌تنه و زنجیره خلفی (همسترینگ، پل باسن و کور)', title_en: 'Day 5: Lower Posterior & Core', focus: 'توسعه تخصصی همسترینگ، عضلات سرینی و ثبات مرکزی' }
    ];

    splitTitles.forEach((meta, idx) => {
      const dayNum = idx + 1;
      let dMain: PrescribedExercise[] = [];
      let dAcc: PrescribedExercise[] = [];
      let dFin: PrescribedExercise[] = [];

      if (dayNum === 1) {
        // Push
        const p1 = pick(['push_horizontal'], 'chest', subLevels.pushLevel);
        const p2 = pick(['push_vertical'], 'shoulders', subLevels.pushLevel);
        const p3 = pick(['push_horizontal'], 'chest', subLevels.pushLevel, [p1.id]);
        if (isShort) {
          dMain = [
            createPe(p1, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${p1.name_fa}): پرس سینه اصلی`, 'foundation', 'KEEP'),
            createPe(p2, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${p2.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP'),
            createPe(p3, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${p3.name_fa}): بالا سینه`, 'foundation', 'KEEP')
          ];
        } else {
          dMain = [
            createPe(p1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${p1.name_fa}): پرس سینه اصلی`, 'foundation', 'KEEP'),
            createPe(p2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${p2.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP'),
            createPe(p3, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${p3.name_fa}): بالا سینه تکمیلی`, 'progression', 'PROGRESS')
          ];
          const arm = pick(['push_horizontal', 'push_vertical'], 'arms', subLevels.overallLevel);
          dAcc = [
            createPe(arm, 3, '10-12', 45, `حرکت ۴ (${arm.name_fa}): پشت بازو تمرکزی`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP')
          ];
        }
      } else if (dayNum === 2) {
        // Pull
        const pull1 = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel);
        const pull2 = pick(['pull_horizontal', 'pull_vertical'], 'back', subLevels.pullLevel, [pull1.id]);
        const shoulderPost = pick(['pull_horizontal', 'push_vertical'], 'shoulders', subLevels.overallLevel);
        if (isShort) {
          dMain = [
            createPe(pull1, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${pull1.name_fa}): کشش عمودی V-Shape`, 'foundation', 'KEEP'),
            createPe(pull2, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${pull2.name_fa}): روینگ افقی پشت`, 'foundation', 'KEEP'),
            createPe(shoulderPost, 2, '12-15', 45, `حرکت ۳ (${shoulderPost.name_fa}): دلتوئید خلفی`, 'foundation', 'KEEP')
          ];
        } else {
          dMain = [
            createPe(pull1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${pull1.name_fa}): کشش عمودی V-Shape`, 'foundation', 'KEEP'),
            createPe(pull2, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${pull2.name_fa}): روینگ افقی ضخامت پشت`, 'foundation', 'KEEP'),
            createPe(shoulderPost, 3, '12-15', 45, `حرکت ۳ (${shoulderPost.name_fa}): دلتوئید خلفی شانه`, 'progression', 'PROGRESS')
          ];
          const core = pick(['core_flexion'], 'core', subLevels.coreLevel);
          dAcc = [
            createPe(core, 3, '12-15', 45, `حرکت ۴ (${core.name_fa}): کرانچ تمرکزی شکم`, 'core', 'KEEP')
          ];
        }
      } else if (dayNum === 3) {
        // Legs
        const sq1 = pick(['squat'], 'legs', subLevels.legsLevel);
        const lunge = pick(['lunge'], 'legs', subLevels.legsLevel, [sq1.id]);
        const calf = pick(['squat', 'lunge'], 'calves', 'beginner');
        if (isShort) {
          dMain = [
            createPe(sq1, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${sq1.name_fa}): اسکوات قدرتی`, 'foundation', 'KEEP'),
            createPe(lunge, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${lunge.name_fa}): لانژ تک‌پایی`, 'foundation', 'KEEP'),
            createPe(calf, 2, '15-20', 45, `حرکت ۳ (${calf.name_fa}): ساق پا ایستاده`, 'foundation', 'KEEP')
          ];
        } else {
          dMain = [
            createPe(sq1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${sq1.name_fa}): اسکوات قدرتی`, 'foundation', 'KEEP'),
            createPe(lunge, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${lunge.name_fa}): لانژ تک‌پایی ران`, 'foundation', 'KEEP'),
            createPe(calf, 3, '15-20', 45, `حرکت ۳ (${calf.name_fa}): ساق پا ایستاده با مکث`, 'progression', 'PROGRESS')
          ];
          const core = pick(['core_anti_extension'], 'core', subLevels.coreLevel);
          dAcc = [
            createPe(core, 3, '40s', 45, `حرکت ۴ (${core.name_fa}): پلانک ثبات ستون فقرات`, 'core', 'KEEP')
          ];
        }
      } else if (dayNum === 4) {
        // Upper Hypertrophy
        const pSec = pick(['push_horizontal'], 'chest', subLevels.pushLevel);
        const pullSec = pick(['pull_vertical'], 'back', subLevels.pullLevel);
        const pV = pick(['push_vertical'], 'shoulders', subLevels.pushLevel);
        if (isShort) {
          dMain = [
            createPe(pSec, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${pSec.name_fa}): شنا شیب‌دار / بالا سینه`, 'foundation', 'KEEP'),
            createPe(pullSec, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${pullSec.name_fa}): بارفیکس / لت دست برعکس`, 'foundation', 'KEEP'),
            createPe(pV, 2, effectiveTargetReps, effectiveRest, `حرکت ۳ (${pV.name_fa}): پرس سرشانه دمبل`, 'foundation', 'KEEP')
          ];
        } else {
          dMain = [
            createPe(pSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${pSec.name_fa}): شنا شیب‌دار / بالا سینه`, 'foundation', 'KEEP'),
            createPe(pullSec, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${pullSec.name_fa}): بارفیکس / لت دست برعکس`, 'foundation', 'KEEP'),
            createPe(pV, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${pV.name_fa}): پرس سرشانه دمبل`, 'progression', 'PROGRESS')
          ];
          const arm = pick(['push_horizontal', 'push_vertical'], 'arms', subLevels.overallLevel);
          dAcc = [
            createPe(arm, 3, '10-12', 45, `حرکت ۴ (${arm.name_fa}): پمپ پشت‌بازو و جلوبازو`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP')
          ];
        }
      } else {
        // Lower Posterior
        const h1 = pick(['hinge'], 'legs', subLevels.legsLevel);
        const lungeB = pick(['lunge'], 'legs', subLevels.legsLevel);
        const coreAnti = pick(['core_anti_extension', 'core_flexion'], 'core', subLevels.coreLevel);
        if (isShort) {
          dMain = [
            createPe(h1, 2, effectiveTargetReps, effectiveRest, `حرکت ۱ (${h1.name_fa}): ددلیفت رومانیایی`, 'foundation', 'KEEP'),
            createPe(lungeB, 2, effectiveTargetReps, effectiveRest, `حرکت ۲ (${lungeB.name_fa}): لانژ بلغاری باسن`, 'foundation', 'KEEP'),
            createPe(coreAnti, 2, '30s', 45, `حرکت ۳ (${coreAnti.name_fa}): پلانک شکم`, 'foundation', 'KEEP')
          ];
        } else {
          dMain = [
            createPe(h1, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${h1.name_fa}): ددلیفت رومانیایی / کشش همسترینگ`, 'foundation', 'KEEP'),
            createPe(lungeB, effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${lungeB.name_fa}): لانژ بلغاری باسن`, 'foundation', 'KEEP')
          ];
          const h2 = pick(['hinge', 'squat'], 'legs', subLevels.legsLevel, [h1.id]);
          dAcc = [
            createPe(h2, 3, '12-15', 45, `حرکت ۳ (${h2.name_fa}): پل باسن تک‌پا ایزوله`, 'progression', 'PROGRESS'),
            createPe(coreAnti, 3, '40s', 45, `حرکت ۴ (${coreAnti.name_fa}): پلانک ساعد ثبات تنه`, 'core', 'KEEP')
          ];
        }
      }

      const w = getWarmup();
      const b = computeDayTimeBudget(w, dMain, dAcc, dFin, rawDuration);

      sessions.push({
        day_number: dayNum,
        title_fa: meta.title_fa,
        title_en: meta.title_en,
        focus_fa: meta.focus,
        estimated_duration_mins: b.total_estimated_mins,
        intensity_level: isShort ? 'moderate' : 'high',
        time_budget_breakdown: b,
        week_theme_fa: weekThemeTitle,
        warmup: w,
        main_workout: dMain,
        accessory: dAcc,
        finisher: dFin
      });
    });
  }

  // =========================================================================
  // 6-DAY SPLIT: PUSH / PULL / LEGS (X2)
  // =========================================================================
  else if (freq === 6) {
    const titles6 = [
      { title_fa: 'روز ۱: پوش A (سینه سنگین و سرشانه)', title_en: 'Day 1: Push Power A', focus: 'بارگذاری مکانیکی روی سینه و سرشانه' },
      { title_fa: 'روز ۲: پول A (کشش عمودی و زیربغل V-Shape)', title_en: 'Day 2: Pull Power A', focus: 'پهنای لت، بارفیکس سنگین و جلوبازو' },
      { title_fa: 'روز ۳: لگز A (اسکوات سنگین و چهارسر ران)', title_en: 'Day 3: Legs Quad Dominant', focus: 'اسکوات قدرتی و توان عضلات ران' },
      { title_fa: 'روز ۴: پوش B (هایپرتروفی، بالای سینه و پمپ پشت‌بازو)', title_en: 'Day 4: Push Hypertrophy B', focus: 'انقباض تمرکزی و حجم سینه و بازو' },
      { title_fa: 'روز ۵: پول B (روینگ ضخامت پشت و دلتوئید خلفی)', title_en: 'Day 5: Pull Hypertrophy B', focus: 'ضخامت میانی پشت و سلامت شانه' },
      { title_fa: 'روز ۶: لگز B (همسترینگ، باسن تک‌پا و ساق)', title_en: 'Day 6: Legs Posterior & Calves', focus: 'زنجیره خلفی، باسن و ساق پا' }
    ];

    titles6.forEach((meta, idx) => {
      const dayNum = idx + 1;
      let dMain: PrescribedExercise[] = [];
      let dAcc: PrescribedExercise[] = [];

      if (dayNum === 1) {
        const p1 = pick(['push_horizontal'], 'chest', subLevels.pushLevel);
        const p2 = pick(['push_vertical'], 'shoulders', subLevels.pushLevel);
        const p3 = pick(['push_horizontal'], 'chest', subLevels.pushLevel, [p1.id]);
        dMain = [
          createPe(p1, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${p1.name_fa}): پرس سینه اصلی`, 'foundation', 'KEEP'),
          createPe(p2, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${p2.name_fa}): پرس سرشانه عمودی`, 'foundation', 'KEEP'),
          createPe(p3, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۳ (${p3.name_fa}): پرس سینه تکمیلی`, 'progression', 'PROGRESS')
        ];
      } else if (dayNum === 2) {
        const pull1 = pick(['pull_vertical', 'pull_horizontal'], 'back', subLevels.pullLevel);
        const pull2 = pick(['pull_horizontal', 'pull_vertical'], 'back', subLevels.pullLevel, [pull1.id]);
        const post = pick(['pull_horizontal', 'push_vertical'], 'shoulders', subLevels.overallLevel);
        dMain = [
          createPe(pull1, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${pull1.name_fa}): کشش عمودی زیربغل`, 'foundation', 'KEEP'),
          createPe(pull2, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${pull2.name_fa}): روینگ افقی پشت`, 'foundation', 'KEEP'),
          createPe(post, isShort ? 2 : 3, '12-15', 45, `حرکت ۳ (${post.name_fa}): دلتوئید خلفی`, 'progression', 'PROGRESS')
        ];
      } else if (dayNum === 3) {
        const sq = pick(['squat'], 'legs', subLevels.legsLevel);
        const lunge = pick(['lunge'], 'legs', subLevels.legsLevel, [sq.id]);
        const calf = pick(['squat', 'lunge'], 'calves', 'beginner');
        dMain = [
          createPe(sq, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${sq.name_fa}): اسکوات قدرتی`, 'foundation', 'KEEP'),
          createPe(lunge, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${lunge.name_fa}): لانژ تک‌پایی`, 'foundation', 'KEEP'),
          createPe(calf, isShort ? 2 : 3, '15-20', 45, `حرکت ۳ (${calf.name_fa}): ساق پا ایستاده`, 'progression', 'PROGRESS')
        ];
      } else if (dayNum === 4) {
        const pSec = pick(['push_horizontal'], 'chest', subLevels.pushLevel);
        const pV = pick(['push_vertical'], 'shoulders', subLevels.pushLevel);
        const arm = pick(['push_horizontal', 'push_vertical'], 'arms', subLevels.overallLevel);
        dMain = [
          createPe(pSec, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${pSec.name_fa}): شنا شیب‌دار / بالا سینه`, 'foundation', 'KEEP'),
          createPe(pV, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${pV.name_fa}): پرس سرشانه دمبل`, 'foundation', 'KEEP'),
          createPe(arm, isShort ? 2 : 3, '10-12', 45, `حرکت ۳ (${arm.name_fa}): پشت‌بازو الماسی / سیم‌کش`, 'accessory', weekNumber === 3 ? 'REPLACE' : 'KEEP')
        ];
      } else if (dayNum === 5) {
        const pullH = pick(['pull_horizontal'], 'back', subLevels.pullLevel);
        const pullV = pick(['pull_vertical'], 'back', subLevels.pullLevel);
        const core = pick(['core_flexion', 'core_anti_extension'], 'core', subLevels.coreLevel);
        dMain = [
          createPe(pullH, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${pullH.name_fa}): روینگ افقی ضخامت پشت`, 'foundation', 'KEEP'),
          createPe(pullV, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${pullV.name_fa}): کشش عمودی V-Shape`, 'foundation', 'KEEP'),
          createPe(core, isShort ? 2 : 3, '12-15', 45, `حرکت ۳ (${core.name_fa}): کرانچ مستقیم شکم`, 'core', 'KEEP')
        ];
      } else {
        const h = pick(['hinge'], 'legs', subLevels.legsLevel);
        const lungeB = pick(['lunge'], 'legs', subLevels.legsLevel);
        const corePlank = pick(['core_anti_extension'], 'core', subLevels.coreLevel);
        dMain = [
          createPe(h, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۱ (${h.name_fa}): ددلیفت رومانیایی`, 'foundation', 'KEEP'),
          createPe(lungeB, isShort ? 2 : effectiveTargetSets, effectiveTargetReps, effectiveRest, `حرکت ۲ (${lungeB.name_fa}): لانژ بلغاری باسن`, 'foundation', 'KEEP'),
          createPe(corePlank, isShort ? 2 : 3, '40s', 45, `حرکت ۳ (${corePlank.name_fa}): پلانک ثبات ستون فقرات`, 'core', 'KEEP')
        ];
      }

      const w = getWarmup();
      const b = computeDayTimeBudget(w, dMain, dAcc, [], rawDuration);

      sessions.push({
        day_number: dayNum,
        title_fa: meta.title_fa,
        title_en: meta.title_en,
        focus_fa: meta.focus,
        estimated_duration_mins: b.total_estimated_mins,
        intensity_level: isShort ? 'moderate' : 'high',
        time_budget_breakdown: b,
        week_theme_fa: weekThemeTitle,
        warmup: w,
        main_workout: dMain,
        accessory: dAcc
      });
    });
  }

  return sessions;
}
