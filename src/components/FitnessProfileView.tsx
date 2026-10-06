import React from 'react';
import { UserAssessment, FitnessProfile, WorkoutProgram } from '../types';
import { FitMaxMascot } from './FitMaxMascot';
import { NavTab } from './Navbar';
import { 
  Dumbbell, 
  Flame, 
  Target, 
  Clock, 
  Sparkles, 
  ArrowLeft, 
  RotateCcw,
  Activity,
  Award
} from 'lucide-react';

interface FitnessProfileViewProps {
  assessment: UserAssessment;
  profile: FitnessProfile;
  program: WorkoutProgram;
  setActiveTab: (tab: NavTab) => void;
  onRetakeAssessment: () => void;
}

export const FitnessProfileView: React.FC<FitnessProfileViewProps> = ({
  assessment,
  profile,
  program,
  setActiveTab,
  onRetakeAssessment
}) => {
  const goalTitleMap: Record<string, string> = {
    muscle_gain: 'افزایش حجم عضلانی (Hypertrophy)',
    v_shape: 'ساخت بدن ۷ شکل (V-Shape)',
    fat_loss: 'چربی‌سوزی و تفکیک عضلانی',
    calisthenics_skill: 'مهارت‌های کلیستنیکس و وزن بدن',
    strength: 'افزایش قدرت خالص',
    general_fitness: 'آمادگی جسمانی عمومی'
  };

  const envTitleMap: Record<string, string> = {
    home: 'خانه',
    park: 'پارک / فضای باز',
    gym: 'باشگاه بدنسازی',
    combination: 'ترکیبی'
  };

  const levelBadgeMap: Record<string, { label: string; color: string }> = {
    beginner: { label: 'مبتدی (Beginner)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    intermediate: { label: 'متوسط (Intermediate)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    advanced: { label: 'پیشرفته (Advanced)', color: 'bg-red-100 text-red-800 border-red-200' }
  };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* FITNESS IDENTITY CARD HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-xl">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>شناسنامه اختصاصی فیت مکس</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              کارت هویت ورزشی (FIT MAX ID)
            </h1>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-3 py-1 rounded-lg font-bold border ${levelBadgeMap[profile.level].color}`}>
                سطح: {levelBadgeMap[profile.level].label}
              </span>
              <span className="bg-slate-800 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 font-semibold">
                محیط: {envTitleMap[profile.environment]}
              </span>
              <span className="bg-slate-800 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 font-semibold">
                فرکانس: {profile.recommendedFrequencyDays} روز در هفته
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              هدف اصلی: <strong className="text-orange-400 font-bold">{goalTitleMap[profile.primaryGoal]}</strong>
            </p>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <FitMaxMascot pose="celebration" size="lg" caption="شناسنامه ورزشی آماده است!" />
          </div>

        </div>
      </div>

      {/* METRICS & CALORIE SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Performance Benchmarks */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>رکوردهای پایه ارزیابی‌شده</span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">تست اولیه</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 text-[10px]">شنا سوئدی:</span>
              <div className="text-base font-black text-slate-900">{assessment.pushupsMax} تکرار</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 text-[10px]">بارفیکس:</span>
              <div className="text-base font-black text-slate-900">{assessment.pullupsMax} تکرار</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 text-[10px]">اسکوات:</span>
              <div className="text-base font-black text-slate-900">{assessment.squatsMax} تکرار</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-500 text-[10px]">ثبت پلانک:</span>
              <div className="text-base font-black text-slate-900">{assessment.plankSeconds} ثانیه</div>
            </div>
          </div>
        </div>

        {/* Card 2: Calorie & Macro Target */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Flame className="w-5 h-5 text-orange-600" />
              <span>هدف کالری و درشت‌مغذی روزانه</span>
            </div>
            <span className="text-[11px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">تخمین علمی</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/70 border border-orange-100">
              <span className="font-bold text-slate-700">کالری روزانه هدف:</span>
              <span className="text-lg font-black text-orange-600">{profile.targetCalories} کیلوکالری</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px]">پروتئین</span>
                <strong className="text-slate-900 font-bold text-sm">{profile.macroProteinGrams}g</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px]">کربوهیدرات</span>
                <strong className="text-slate-900 font-bold text-sm">{profile.macroCarbsGrams}g</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px]">چربی</span>
                <strong className="text-slate-900 font-bold text-sm">{profile.macroFatsGrams}g</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* GENERATED PROGRAM SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-3xl p-8 space-y-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
            <Award className="w-4 h-4" />
            <span>برنامه تمرینی اختصاصی آماده اجرا است</span>
          </div>
          <h2 className="text-2xl font-black">{program.title_fa}</h2>
          <p className="text-xs text-orange-100 leading-relaxed">{program.description_fa}</p>
        </div>

        <button
          onClick={() => setActiveTab('workout')}
          className="bg-white text-orange-700 hover:bg-orange-50 font-black px-8 py-4 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0"
        >
          <Dumbbell className="w-5 h-5" />
          <span>شروع تمرین امروز</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Re-take Assessment */}
      <div className="text-center pt-2">
        <button
          onClick={onRetakeAssessment}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ویرایش یا انجام مجدد ارزیابی آمادگی</span>
        </button>
      </div>

    </div>
  );
};
