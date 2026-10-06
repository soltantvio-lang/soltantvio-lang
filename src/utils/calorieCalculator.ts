import { UserAssessment } from '../types';

export interface CalorieCalculationResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  goalExplanation_fa: string;
}

export function calculateNutrition(assessment: Partial<UserAssessment>): CalorieCalculationResult {
  const age = assessment.age || 25;
  const sex = assessment.sex || 'male';
  const heightCm = assessment.heightCm || 175;
  const weightKg = assessment.weightKg || 70;
  const activityLevel = assessment.dailyActivityLevel || 'moderate';
  const primaryGoal = assessment.primaryGoal || 'muscle_gain';

  // 1. Calculate BMR (Mifflin-St Jeor Equation)
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (sex === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.round(bmr);

  // 2. Activity Multiplier for TDEE
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // 3. Goal Calorie Target Adjustment
  let targetCalories = tdee;
  let explanation = '';

  if (primaryGoal === 'fat_loss') {
    targetCalories = Math.round(tdee * 0.80); // 20% deficit
    explanation = 'ایجاد ۲۰٪ دفسیت کالری برای چربی‌سوزی تدریجی همراه با حفظ حداکثری حجم عضلانی.';
  } else if (primaryGoal === 'muscle_gain' || primaryGoal === 'v_shape') {
    targetCalories = Math.round(tdee * 1.10); // 10% surplus
    explanation = 'ایجاد ۱۰٪ مازاد کالری تمیز برای سنتز بهینه پروتئین و هایپرتروفی عضلانی بدون چربی اضافه.';
  } else if (primaryGoal === 'strength') {
    targetCalories = Math.round(tdee * 1.05); // 5% surplus
    explanation = 'مازاد کالری خفیف برای تامین انرژی سیستم عصبی مرکزی و بازسازی ذخایر گلیکوژن.';
  } else {
    targetCalories = tdee;
    explanation = 'کالری تثبیت (Maintenance) برای حفظ وزن، بهبود ترکیب بدنی و افزایش استقامت.';
  }

  // 4. Macro Distribution (Protein 2.0g/kg, Fat 25% total kcal, Carbs remainder)
  const proteinGrams = Math.round(weightKg * 2.0); // 2g per kg
  const proteinCalories = proteinGrams * 4;

  const fatsCalories = targetCalories * 0.25; // 25% of calories from fat
  const fatsGrams = Math.round(fatsCalories / 9);

  const carbsCalories = Math.max(0, targetCalories - (proteinCalories + fatsCalories));
  const carbsGrams = Math.round(carbsCalories / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    goalExplanation_fa: explanation
  };
}
