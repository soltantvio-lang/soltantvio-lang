import React from 'react';
import { UserAssessment, FitnessProfile, WorkoutLog } from '../types';
import { FitMaxMascot } from './FitMaxMascot';
import { User, Activity, Trophy, Calendar, CheckCircle, RotateCcw, TrendingUp } from 'lucide-react';

interface ProfileProgressViewProps {
  assessment: UserAssessment | null;
  profile: FitnessProfile | null;
  workoutLogs: WorkoutLog[];
  onOpenAssessment: () => void;
}

export const ProfileProgressView: React.FC<ProfileProgressViewProps> = ({
  assessment,
  profile,
  workoutLogs,
  onOpenAssessment
}) => {
  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* USER PROFILE HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl space-y-4 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <User className="w-4 h-4" />
            <span>پروفایل کاربری فیت مکس</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">حساب کاربری و تاریخچه پیشرفت</h1>
          <p className="text-xs text-slate-400">اطلاعات فیزیکی، رکوردهای پایه و جلسات تمرینی ثبت‌شده شما</p>
        </div>

        <button
          onClick={onOpenAssessment}
          className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs shadow-md transition flex items-center gap-2 shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تکمیل یا ویرایش ارزیابی</span>
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
        <div className="p-6 rounded-3xl bg-white border border-orange-100 shadow-xs space-y-2">
          <span className="text-slate-500 font-bold block">تعداد جلسات تمرین ثبت‌شده</span>
          <strong className="text-3xl font-black text-orange-600 block">{workoutLogs.length} جلسه</strong>
          <span className="text-slate-400 block text-[10px]">استمرار در اجرای برنامه</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-orange-100 shadow-xs space-y-2">
          <span className="text-slate-500 font-bold block">سطح آمادگی جسمانی</span>
          <strong className="text-2xl font-black text-slate-900 block capitalize">
            {profile?.level === 'beginner' ? 'مبتدی' : profile?.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
          </strong>
          <span className="text-slate-400 block text-[10px]">بر اساس تست رکوردهای پایه</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-orange-100 shadow-xs space-y-2">
          <span className="text-slate-500 font-bold block">هدف کالری روزانه</span>
          <strong className="text-2xl font-black text-amber-600 block">
            {profile?.targetCalories || 2200} kcal
          </strong>
          <span className="text-slate-400 block text-[10px]">بر بر پایه فرمول Mifflin-St Jeor</span>
        </div>
      </div>

      {/* WORKOUT LOG HISTORY TABLE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <Calendar className="w-5 h-5 text-orange-600" />
            <span>تاریخچه جلسات تمرینی (Workout Logs)</span>
          </div>
          <span className="text-xs text-slate-500">{workoutLogs.length} ثبت شده</span>
        </div>

        {workoutLogs.length === 0 ? (
          <div className="text-center py-8 space-y-3 text-slate-500 text-xs">
            <FitMaxMascot pose="empty" size="md" />
            <p>هنوز هیچ جلسه تمرینی ثبت نکرده‌اید. اولین تمرین خود را از بخش «برنامه تمرینی من» آغاز کنید!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workoutLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">جلسه روز {log.day_number}</span>
                    <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">
                      {log.date}
                    </span>
                  </div>
                  <span className="text-slate-500 block">مدت: {log.duration_minutes} دقیقه | میزان خستگی: {log.overall_fatigue_1_10}/۱۰</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                  <span>تکمیل شد</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
