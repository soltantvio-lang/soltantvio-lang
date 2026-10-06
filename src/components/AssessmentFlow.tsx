import React, { useState } from 'react';
import { 
  UserAssessment, 
  FitnessLevel, 
  GoalType, 
  EnvironmentType, 
  EquipmentType, 
  PhysicalLimitation,
  FitnessProfile,
  WorkoutProgram
} from '../types';
import { 
  generateWeek1InitialPlan, 
  generateComplete4WeekTrainingPlan, 
  generateAdaptiveWorkoutProgram 
} from '../utils/workoutEngine';
import { calculateNutrition } from '../utils/calorieCalculator';
import { FitMaxMascot } from './FitMaxMascot';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Dumbbell, 
  Activity,
  Heart
} from 'lucide-react';

interface AssessmentFlowProps {
  onAssessmentComplete: (assessment: UserAssessment, profile: FitnessProfile, program: WorkoutProgram) => void;
  initialData?: UserAssessment;
}

export const AssessmentFlow: React.FC<AssessmentFlowProps> = ({
  onAssessmentComplete,
  initialData
}) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState<UserAssessment>(initialData || {
    age: 24,
    sex: 'male',
    heightCm: 175,
    weightKg: 72,
    
    pushupsMax: 12,
    pullupsMax: 3,
    squatsMax: 25,
    plankSeconds: 45,
    experienceMonths: 6,
    calculatedLevel: 'intermediate',

    environment: 'home',
    equipment: ['bodyweight', 'pullup_bar'],

    primaryGoal: 'muscle_gain',
    secondaryGoals: ['v_shape', 'strength'],

    trainingDaysPerWeek: 4,
    minutesPerSession: 60,
    dailyActivityLevel: 'moderate',
    sleepHours: 7,

    limitations: [],
    hasMedicalCondition: false
  });

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else {
      // Calculate Fitness Level
      let calculatedLevel: FitnessLevel = 'beginner';
      const pMax = formData.pushupsMax || 0;
      const pullMax = formData.pullupsMax || 0;
      const exp = formData.experienceMonths || 0;

      if (pMax >= 25 || pullMax >= 10 || exp >= 18) {
        calculatedLevel = 'advanced';
      } else if (pMax >= 8 || pullMax >= 2 || exp >= 3) {
        calculatedLevel = 'intermediate';
      } else {
        calculatedLevel = 'beginner';
      }

      const finalAssessment: UserAssessment = {
        ...formData,
        calculatedLevel
      };

      // Calculate Calories
      const nutrition = calculateNutrition(finalAssessment);

      const profile: FitnessProfile = {
        level: calculatedLevel,
        primaryGoal: finalAssessment.primaryGoal,
        environment: finalAssessment.environment,
        recommendedFrequencyDays: finalAssessment.trainingDaysPerWeek,
        estimatedBMR: nutrition.bmr,
        estimatedTDEE: nutrition.tdee,
        targetCalories: nutrition.targetCalories,
        macroProteinGrams: nutrition.proteinGrams,
        macroCarbsGrams: nutrition.carbsGrams,
        macroFatsGrams: nutrition.fatsGrams,
        createdAt: new Date().toISOString()
      };

      // Generate Evidence-Based Sequential Week 1 Plan (Adaptive Week-by-Week Engine)
      const program = generateWeek1InitialPlan(finalAssessment);

      onAssessmentComplete(finalAssessment, profile, program);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const toggleEquipment = (eq: EquipmentType) => {
    if (formData.equipment.includes(eq)) {
      setFormData({
        ...formData,
        equipment: formData.equipment.filter(e => e !== eq)
      });
    } else {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, eq]
      });
    }
  };

  const toggleLimitation = (lim: PhysicalLimitation) => {
    if (lim === 'none') {
      setFormData({ ...formData, limitations: [] });
      return;
    }
    if (formData.limitations.includes(lim)) {
      setFormData({
        ...formData,
        limitations: formData.limitations.filter(l => l !== lim)
      });
    } else {
      setFormData({
        ...formData,
        limitations: [...formData.limitations, lim]
      });
    }
  };

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* Header & Progress */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600 font-extrabold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>ارزیابی علمی آمادگی جسمانی فیت مکس</span>
          </div>
          <span className="text-xs font-bold text-slate-500">گام {step} از ۶</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-l from-orange-500 to-amber-500 h-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Step Content */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100 shadow-sm space-y-8">
        
        {/* STEP 1: BASIC INFO */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <FitMaxMascot pose="welcome" size="sm" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">گام ۱: اطلاعات پایه فردی</h2>
                <p className="text-xs text-slate-500">مشخصات اولیه جهت محاسبه BMR و ترکیب بدنی</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">جنسیت</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sex: 'male' })}
                    className={`py-3 rounded-xl text-xs font-bold border transition ${
                      formData.sex === 'male' 
                        ? 'bg-orange-600 text-white border-orange-600' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    مرد
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sex: 'female' })}
                    className={`py-3 rounded-xl text-xs font-bold border transition ${
                      formData.sex === 'female' 
                        ? 'bg-orange-600 text-white border-orange-600' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    زن
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">سن (سال)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 20 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">قد (سانتی‌متر)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: parseInt(e.target.value) || 170 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">وزن (کیلوگرم)</label>
                <input
                  type="number"
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: parseInt(e.target.value) || 70 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FITNESS BENCHMARKS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <FitMaxMascot pose="workout" size="sm" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">گام ۲: سنجش رکوردها و سطح آمادگی</h2>
                <p className="text-xs text-slate-500">حداکثر توان حرکتی در یک ست صحیح بدون شکست فرم</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">حداکثر شنا سوئدی صحیح (تکرار)</label>
                <input
                  type="number"
                  value={formData.pushupsMax}
                  onChange={(e) => setFormData({ ...formData, pushupsMax: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">حداکثر بارفیکس صحیح (تکرار)</label>
                <input
                  type="number"
                  value={formData.pullupsMax}
                  onChange={(e) => setFormData({ ...formData, pullupsMax: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">حداکثر اسکوات وزن بدن (تکرار)</label>
                <input
                  type="number"
                  value={formData.squatsMax}
                  onChange={(e) => setFormData({ ...formData, squatsMax: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">رکورد پلانک (ثانیه)</label>
                <input
                  type="number"
                  value={formData.plankSeconds}
                  onChange={(e) => setFormData({ ...formData, plankSeconds: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-700">سابقه تمرین مستمر (ماه)</label>
                <input
                  type="number"
                  value={formData.experienceMonths}
                  onChange={(e) => setFormData({ ...formData, experienceMonths: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ENVIRONMENT & EQUIPMENT */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">گام ۳: محیط تمرین و تجهیزات در دسترس</h2>
              <p className="text-xs text-slate-500">برنامه تمرینی دقیقاً بر اساس ابزارهای واقعی شما طراحی می‌شود</p>
            </div>

            {/* Environment */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">محل تمرین اصلی</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'home', label: 'خانه' },
                  { id: 'park', label: 'پارک / فضای باز' },
                  { id: 'gym', label: 'باشگاه بدنسازی' },
                  { id: 'combination', label: 'ترکیبی' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, environment: item.id as EnvironmentType })}
                    className={`p-3 rounded-xl text-xs font-bold border transition ${
                      formData.environment === item.id 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment checklist */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700">تجهیزات موجود (می‌توانید چند مورد انتخاب کنید)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'bodyweight', label: 'وزن بدن (بدون ابزار)' },
                  { id: 'pullup_bar', label: 'میله بارفیکس' },
                  { id: 'parallel_bars', label: 'میله پارالل / دیپس' },
                  { id: 'resistance_bands', label: 'کش‌های کششی / کش کلیستنیکس' },
                  { id: 'dumbbells', label: 'دمبل' },
                  { id: 'barbell', label: 'هالتر و وزنه' },
                  { id: 'gym_machines', label: 'دستگاه‌های باشگاهی' }
                ].map((eq) => {
                  const isChecked = formData.equipment.includes(eq.id as EquipmentType);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquipment(eq.id as EquipmentType)}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-bold border transition text-right ${
                        isChecked 
                          ? 'bg-orange-50 text-orange-700 border-orange-300' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{eq.label}</span>
                      <CheckCircle2 className={`w-4 h-4 ${isChecked ? 'text-orange-600' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: GOALS */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">گام ۴: اهداف تمرینی اصلی</h2>
              <p className="text-xs text-slate-500">حجم تمرین و تکرارها بر اساس هدف شما تنظیم می‌شود</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'muscle_gain', title: 'افزایش حجم عضلانی (Hypertrophy)', desc: 'ساخت فیبرهای عضلانی و برجسته‌سازی فیزیک' },
                { id: 'v_shape', title: 'بدن ۷ شکل (V-Shape)', desc: 'عریض کردن زیربغل و سرشانه و باریک‌تر نشان دادن کمر' },
                { id: 'fat_loss', title: 'چربی‌سوزی و تفکیک (Definition)', desc: 'کاهش درصد چربی بدن همراه با حفظ بافت عضلانی' },
                { id: 'calisthenics_skill', title: 'مهارت‌های کلیستنیکس', desc: 'افزایش قدرت نسبی برای بارفیکس، دیپس و تکنیک‌های قدرتی' },
                { id: 'strength', title: 'افزایش قدرت خالص (Strength)', desc: 'افزایش توان عصبی عضلانی و رکورد حرکات پایه' },
                { id: 'general_fitness', title: 'آمادگی جسمانی عمومی', desc: 'افزایش انرژی روزانه، سلامت مفاصل و تناسب اندام' }
              ].map((goal) => {
                const isSelected = formData.primaryGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, primaryGoal: goal.id as GoalType })}
                    className={`p-4 rounded-2xl text-right border transition space-y-1 ${
                      isSelected 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{goal.title}</div>
                    <div className={`text-xs ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>{goal.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: LIFESTYLE & AVAILABILITY */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">گام ۵: زمان‌بندی و سبک زندگی</h2>
              <p className="text-xs text-slate-500">تعداد روزهای تمرین و زمان هر جلسه در هفته</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">تعداد روزهای تمرین در هفته</label>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData({ ...formData, trainingDaysPerWeek: days })}
                      className={`py-3 rounded-xl text-xs font-bold border transition ${
                        formData.trainingDaysPerWeek === days 
                          ? 'bg-orange-600 text-white border-orange-600' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50'
                      }`}
                    >
                      {days} روز
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">زمان هر جلسه تمرین (دقیقه)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFormData({ ...formData, minutesPerSession: mins })}
                      className={`py-3 rounded-xl text-xs font-bold border transition ${
                        formData.minutesPerSession === mins 
                          ? 'bg-orange-600 text-white border-orange-600' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50'
                      }`}
                    >
                      {mins} دقیقه
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700">میزان فعالیت غیرورزشی روزانه</label>
                <select
                  value={formData.dailyActivityLevel}
                  onChange={(e) => setFormData({ ...formData, dailyActivityLevel: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                >
                  <option value="sedentary">پشت‌میزنشین / کم‌تحرک (کار اداری)</option>
                  <option value="light">فعالیت سبک (پیاده‌روی روزانه)</option>
                  <option value="moderate">فعالیت متوسط (ایستاده یا پرتحرک)</option>
                  <option value="active">پرتحرک (کار فیزیکی)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: PHYSICAL LIMITATIONS & SAFETY */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <FitMaxMascot pose="caution" size="sm" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">گام ۶: غربالگری سلامت و محدودیت‌های مفصلی</h2>
                <p className="text-xs text-slate-500">حذف حرکت‌های آسیب‌زا و جایگزینی با نسخه‌های ایمن</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">آیا در مفصل خاصی درد یا محدودیت دارید؟</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'none', label: 'هیچ درد یا محدودیتی ندارم' },
                  { id: 'shoulder_pain', label: 'درد یا ناهنجاری مفصل شانه' },
                  { id: 'wrist_pain', label: 'درد مچ دست در فشار' },
                  { id: 'knee_pain', label: 'درد یا سابقه آسیب زانو' },
                  { id: 'lower_back_pain', label: 'گودی کمر شدید یا دیسک کمر' },
                  { id: 'elbow_pain', label: 'درد آرنج / آرنج تنس‌بازان' }
                ].map((lim) => {
                  const isChecked = lim.id === 'none' 
                    ? formData.limitations.length === 0 
                    : formData.limitations.includes(lim.id as PhysicalLimitation);
                  return (
                    <button
                      key={lim.id}
                      type="button"
                      onClick={() => toggleLimitation(lim.id as PhysicalLimitation)}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-bold border transition text-right ${
                        isChecked 
                          ? 'bg-amber-50 text-amber-800 border-amber-300' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{lim.label}</span>
                      <CheckCircle2 className={`w-4 h-4 ${isChecked ? 'text-amber-600' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medical Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs leading-relaxed">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">هشدار ایمنی فیت مکس:</span>
                در صورت داشتن درد حاد شدید، بیماری‌های قلبی عروقی، فشار خون بالا یا سابقه جراحی اخیر، حتماً قبل از شروع هرگونه برنامه ورزشی با پزشک معالج ارزیابی شوید.
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[48px] flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer active:scale-98 shadow-2xs"
            >
              <ArrowRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[48px] flex items-center gap-2 px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-600/20 transition cursor-pointer active:scale-98"
          >
            <span>{step === 6 ? 'ایجاد شناسنامه و برنامه اختصاصی' : 'گام بعدی'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
