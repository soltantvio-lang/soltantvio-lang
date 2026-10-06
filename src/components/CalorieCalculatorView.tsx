import React, { useState } from 'react';
import { calculateNutrition, CalorieCalculationResult } from '../utils/calorieCalculator';
import { Calculator, Flame, Info, Sparkles, PieChart, Utensils } from 'lucide-react';

export const CalorieCalculatorView: React.FC = () => {
  const [age, setAge] = useState(25);
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(72);
  const [activity, setActivity] = useState<string>('moderate');
  const [goal, setGoal] = useState<string>('muscle_gain');

  const result: CalorieCalculationResult = calculateNutrition({
    age,
    sex,
    heightCm,
    weightKg,
    dailyActivityLevel: activity as any,
    primaryGoal: goal as any
  });

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl space-y-3 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 bg-sky-600/20 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <Calculator className="w-4 h-4" />
          <span>فرمول علمی Mifflin-St Jeor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">محاسبه‌گر تخصصی کالری، TDEE و درشت‌مغذی‌ها</h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          محاسبه دقیق متابولیسم پایه (BMR)، کل انرژی مصرفی روزانه (TDEE) و تفکیک دقیق پروتئین، کربوهیدرات و چربی بر اساس آنتروپومتری شما.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT FORM CONTROLS */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-orange-100 shadow-xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            ورود اطلاعات آنتروپومتری
          </h2>

          <div className="space-y-4 text-xs font-bold text-slate-700">
            
            {/* Sex */}
            <div className="space-y-1.5">
              <label>جنسیت</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSex('male')}
                  className={`py-2.5 rounded-xl border transition ${
                    sex === 'male' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  مرد
                </button>
                <button
                  type="button"
                  onClick={() => setSex('female')}
                  className={`py-2.5 rounded-xl border transition ${
                    sex === 'female' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  زن
                </button>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label>سن (سال)</label>
                <span className="text-orange-600 font-extrabold">{age} سال</span>
              </div>
              <input
                type="range"
                min="15"
                max="75"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            {/* Height */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label>قد (سانتی‌متر)</label>
                <span className="text-orange-600 font-extrabold">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min="140"
                max="210"
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            {/* Weight */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label>وزن (کیلوگرم)</label>
                <span className="text-orange-600 font-extrabold">{weightKg} kg</span>
              </div>
              <input
                type="range"
                min="40"
                max="150"
                value={weightKg}
                onChange={(e) => setWeightKg(parseInt(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            {/* Activity Level */}
            <div className="space-y-1.5 pt-2">
              <label>سطح فعالیت روزانه غیرورزشی</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
              >
                <option value="sedentary">پشت‌میزنشین / کم‌تحرک (ضریب ۱.۲)</option>
                <option value="light">تحرک سبک (ضریب ۱.۳۷۵)</option>
                <option value="moderate">تحرک متوسط (ضریب ۱.۵۵)</option>
                <option value="active">پرتحرک / کار فیزیکی (ضریب ۱.۷۲۵)</option>
                <option value="very_active">فعالیت بسیار سنگین (ضریب ۱.۹)</option>
              </select>
            </div>

            {/* Primary Goal */}
            <div className="space-y-1.5">
              <label>هدف اصلی ترکیب بدنی</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
              >
                <option value="muscle_gain">افزایش حجم تمیز (۱۰٪ مازاد کالری)</option>
                <option value="fat_loss">چربی‌سوزی و تفکیک (۲۰٪ دفسیت کالری)</option>
                <option value="strength">افزایش قدرت و عملکرد (۵٪ مازاد)</option>
                <option value="maintenance">تثبیت وزن (Maintenance)</option>
              </select>
            </div>

          </div>
        </div>

        {/* CALCULATION RESULTS */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-6 rounded-3xl shadow-md space-y-4">
            <span className="text-xs font-bold text-orange-100 block">هدف کالری اختصاصی شما:</span>
            <div className="text-4xl font-black tracking-tight">{result.targetCalories} <span className="text-lg font-normal text-amber-100">kcal / روز</span></div>
            <p className="text-xs text-orange-50 leading-relaxed pt-1 border-t border-white/20">
              {result.goalExplanation_fa}
            </p>
          </div>

          {/* BMR & TDEE breakdown */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[10px]">متابولیسم پایه (BMR):</span>
              <strong className="text-base font-black text-slate-900">{result.bmr} kcal</strong>
              <span className="text-[10px] text-slate-400 block">انرژی ارگان‌ها در استراحت</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[10px]">انرژی مصرفی کل (TDEE):</span>
              <strong className="text-base font-black text-slate-900">{result.tdee} kcal</strong>
              <span className="text-[10px] text-slate-400 block">شامل فعالیت‌های روزانه</span>
            </div>
          </div>

          {/* Macro Split Card */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              <PieChart className="w-5 h-5 text-orange-600" />
              <span>تقسیم‌بندی درشت‌مغذی‌ها (Macros)</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100 space-y-1">
                <span className="text-xs font-bold text-orange-900 block">پروتئین</span>
                <strong className="text-lg font-black text-orange-600">{result.proteinGrams}g</strong>
                <span className="text-[10px] text-orange-700 block">{result.proteinGrams * 4} kcal</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <span className="text-xs font-bold text-amber-900 block">کربوهیدرات</span>
                <strong className="text-lg font-black text-amber-600">{result.carbsGrams}g</strong>
                <span className="text-[10px] text-amber-700 block">{result.carbsGrams * 4} kcal</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 space-y-1">
                <span className="text-xs font-bold text-sky-900 block">چربی مفید</span>
                <strong className="text-lg font-black text-sky-600">{result.fatsGrams}g</strong>
                <span className="text-[10px] text-sky-700 block">{result.fatsGrams * 9} kcal</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
