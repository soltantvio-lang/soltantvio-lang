import React, { useState } from 'react';
import { PRODUCTS_DATABASE } from '../data/products';
import { Trophy, CheckCircle2, Flame, Award, Sparkles } from 'lucide-react';

export const ChallengesView: React.FC = () => {
  const challenges = PRODUCTS_DATABASE.filter(p => p.type === 'challenge');
  const [completedDays, setCompletedDays] = useState<Record<string, number[]>>({
    prod_30day_pullup: [1, 2, 3]
  });

  const toggleDay = (challengeId: string, dayNum: number) => {
    const current = completedDays[challengeId] || [];
    if (current.includes(dayNum)) {
      setCompletedDays({
        ...completedDays,
        [challengeId]: current.filter(d => d !== dayNum)
      });
    } else {
      setCompletedDays({
        ...completedDays,
        [challengeId]: [...current, dayNum]
      });
    }
  };

  return (
    <div dir="rtl" className="max-w-5xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl space-y-3 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <Trophy className="w-4 h-4" />
          <span>چالش‌های انگیزش و استمرار فیت مکس</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">چالش‌های تمرینی آنلاین و رایگان</h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          روزانه تکالیف مشخص را انجام داده و با زدن چک‌باکس‌ها، ثبات و پیشرفت خود را در تقویم چالش پیگیری کنید.
        </p>
      </div>

      <div className="space-y-8">
        {challenges.map((ch) => {
          const daysList = Array.from({ length: ch.duration_days || 30 }, (_, i) => i + 1);
          const done = completedDays[ch.id] || [];
          const progressPercent = Math.round((done.length / daysList.length) * 100);

          return (
            <div key={ch.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {ch.duration_days} روزه
                    </span>
                    <h2 className="text-xl font-black text-slate-900">{ch.title_fa}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ch.description_fa}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block font-bold">میزان پیشرفت</span>
                    <span className="text-base font-black text-orange-600">{progressPercent}%</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Day Checkbox Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">روزهای چالش را تکمیل کرده و تیک بزنید:</span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {daysList.map((dayNum) => {
                    const isChecked = done.includes(dayNum);
                    return (
                      <button
                        key={dayNum}
                        onClick={() => toggleDay(ch.id, dayNum)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border ${
                          isChecked 
                            ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-orange-300'
                        }`}
                      >
                        <span>روز {dayNum}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
