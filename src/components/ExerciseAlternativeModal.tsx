import React from 'react';
import { Exercise, UserAssessment } from '../types';
import { getSmartAlternativeDetails } from '../utils/workoutEngine';
import { X, Sparkles, Check, ArrowRight, ShieldCheck, Dumbbell, AlertTriangle } from 'lucide-react';

interface ExerciseAlternativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise: Exercise;
  originalExercise: Exercise;
  alternatives: Exercise[];
  hasLoggedSets: boolean;
  onSelectAlternative: (newExercise: Exercise) => void;
  onRestoreOriginal?: () => void;
}

export const ExerciseAlternativeModal: React.FC<ExerciseAlternativeModalProps> = ({
  isOpen,
  onClose,
  currentExercise,
  originalExercise,
  alternatives,
  hasLoggedSets,
  onSelectAlternative,
  onRestoreOriginal
}) => {
  if (!isOpen) return null;

  const isCurrentReplaced = currentExercise.id !== originalExercise.id;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-right animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-orange-600/30 text-orange-400 border border-orange-500/30">
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                جایگزین معادل حرکت
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                حفظ الگوی حرکتی، عضلات هدف و ایمنی مفاصل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Current Active Exercise Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500">حرکت فعلی در این جلسه:</span>
              {isCurrentReplaced && (
                <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md font-black text-[10px]">
                  جایگزین‌شده
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-black text-slate-900">{currentExercise.name_fa}</span>
              <span className="text-[11px] text-slate-400 font-mono">{currentExercise.name_en}</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
              <span>🎯 عضلات هدف:</span>
              <span className="font-bold text-slate-800">{currentExercise.primary_muscles.join('، ')}</span>
            </div>
          </div>

          {/* Warning if sets are already logged */}
          {hasLoggedSets && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-black block">توجه: ست‌های این حرکت ثبت شده‌اند</span>
                <span className="text-[11px] text-amber-800 leading-relaxed block">
                  با انتخاب جایگزین، ست‌های قبلی شما با برچسب حرکت جدید در تاریخچه جلسه جاری ادامه می‌یابند.
                </span>
              </div>
            </div>
          )}

          {/* Return to Original Exercise Option if previously replaced */}
          {isCurrentReplaced && onRestoreOriginal && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-emerald-950 block">بازگشت به حرکت اصلی برنامه:</span>
                <span className="text-[11px] font-bold text-emerald-800">{originalExercise.name_fa}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRestoreOriginal();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-2xs"
              >
                بازگشت به اصلی
              </button>
            </div>
          )}

          {/* Alternatives List (Max 2 items) */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-slate-800 block">
              گزینه‌های معادل ورزشی (حداکثر ۲ جایگزین ایمن):
            </span>

            {alternatives.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                <ShieldCheck className="w-6 h-6 text-slate-400 mx-auto" />
                <span>جایگزین معادل دیگری متناسب با تجهیزات و ایمنی فعلی شما یافت نشد.</span>
              </div>
            ) : (
              alternatives.map((alt, index) => {
                const details = getSmartAlternativeDetails(currentExercise, alt);

                return (
                  <div
                    key={alt.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 transition space-y-2.5 shadow-2xs group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-800 text-[10px] font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            {alt.name_fa}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block pr-6.5">
                          {alt.name_en}
                        </span>
                      </div>

                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                        {details.badge_fa}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p>{details.reason_fa}</p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-bold">
                        <span>🎯 عضلات: {alt.primary_muscles.join('، ')}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectAlternative(alt);
                        onClose();
                      }}
                      className="w-full min-h-[48px] py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>انتخاب این جایگزین</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            انصراف و بستن
          </button>
        </div>

      </div>
    </div>
  );
};
