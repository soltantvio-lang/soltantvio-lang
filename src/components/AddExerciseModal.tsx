import React, { useState, useMemo } from 'react';
import { 
  WorkoutDay, 
  UserAssessment, 
  Exercise, 
  PrescribedExercise, 
  EquipmentType,
  PhysicalLimitation,
  FitnessLevel
} from '../types';
import { EXERCISES_DATABASE } from '../data/exercises';
import { isExerciseAvailable } from '../utils/workoutEngine';
import { calculateExerciseDuration } from '../utils/splitBuilder';
import { 
  Plus, 
  X, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Sparkles, 
  Clock, 
  Dumbbell, 
  Zap,
  Info,
  ChevronLeft
} from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: WorkoutDay;
  weekNumber: number;
  assessment?: UserAssessment | null;
  onAddExercise: (newPrescribed: PrescribedExercise) => void;
}

type MuscleFilterCategory = 'all' | 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  day,
  weekNumber,
  assessment,
  onAddExercise
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MuscleFilterCategory>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [setsCount, setSetsCount] = useState<number>(3);
  const [targetReps, setTargetReps] = useState<string>('10-12');
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [exerciseRole, setExerciseRole] = useState<'accessory' | 'finisher'>('accessory');

  // Existing exercises in this day to prevent direct duplicate
  const existingIds = useMemo(() => {
    const ids = new Set<string>();
    day.warmup?.forEach(e => ids.add(e.exercise_id));
    day.main_workout?.forEach(e => ids.add(e.exercise_id));
    day.accessory?.forEach(e => ids.add(e.exercise_id));
    day.finisher?.forEach(e => ids.add(e.exercise_id));
    return ids;
  }, [day]);

  // Current session duration
  const currentDuration = day.time_budget_breakdown?.total_estimated_mins || 45;
  const targetBudget = day.time_budget_breakdown?.target_budget_mins || (assessment?.minutesPerSession || 60);

  // Evaluate candidate exercises against 10 safety & compatibility criteria
  const evaluatedExercises = useMemo(() => {
    return EXERCISES_DATABASE.map(ex => {
      const isAlreadyAdded = existingIds.has(ex.id);
      
      let isAvailable = true;
      let reasonFa = '';
      if (assessment) {
        const check = isExerciseAvailable(ex, assessment);
        isAvailable = check.available;
        reasonFa = check.reason_fa || '';
      }

      // Check muscle category match
      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'chest') {
          matchesCategory = ex.category === 'chest' || ex.primary_muscles.some(m => m.includes('سینه'));
        } else if (selectedCategory === 'back') {
          matchesCategory = ex.category === 'back' || ex.primary_muscles.some(m => m.includes('پشت') || m.includes('لت'));
        } else if (selectedCategory === 'legs') {
          matchesCategory = ex.category === 'legs' || ex.primary_muscles.some(m => m.includes('ران') || m.includes('پا') || m.includes('ساق') || m.includes('همسترینگ'));
        } else if (selectedCategory === 'shoulders') {
          matchesCategory = ex.category === 'shoulders' || ex.primary_muscles.some(m => m.includes('سرشانه') || m.includes('دلتوئید'));
        } else if (selectedCategory === 'arms') {
          matchesCategory = ex.category === 'arms' || ex.primary_muscles.some(m => m.includes('بازو') || m.includes('ساعد'));
        } else if (selectedCategory === 'core') {
          matchesCategory = ex.category === 'core' || ex.primary_muscles.some(m => m.includes('شکم') || m.includes('میان‌تنه') || m.includes('پهلو'));
        } else if (selectedCategory === 'cardio') {
          matchesCategory = ex.movement_pattern === 'cardio' || ex.primary_muscles.some(m => m.includes('قلبی') || m.includes('کل بدن'));
        }
      }

      // Search match
      const matchesSearch = searchQuery.trim() === '' || 
        ex.name_fa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.primary_muscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCompatible = isAvailable && !isAlreadyAdded;

      return {
        exercise: ex,
        isCompatible,
        isAlreadyAdded,
        reasonFa: reasonFa || (isAlreadyAdded ? 'این حرکت هم‌اکنون در این جلسه وجود دارد' : ''),
        matchesCategory,
        matchesSearch
      };
    });
  }, [existingIds, assessment, selectedCategory, searchQuery]);

  // Filtered lists
  const visibleExercises = useMemo(() => {
    return evaluatedExercises.filter(item => item.matchesCategory && item.matchesSearch);
  }, [evaluatedExercises]);

  const compatibleExercises = useMemo(() => {
    return visibleExercises.filter(item => item.isCompatible);
  }, [visibleExercises]);

  const incompatibleExercises = useMemo(() => {
    return visibleExercises.filter(item => !item.isCompatible);
  }, [visibleExercises]);

  if (!isOpen) return null;

  const estimatedAddedMins = calculateExerciseDuration(setsCount, targetReps, restSeconds, '2-0-1-0');
  const projectedDuration = currentDuration + estimatedAddedMins;
  const isOverBudget = projectedDuration > targetBudget + 10;

  const handleConfirmAdd = () => {
    if (!selectedExercise) return;

    const newPrescribed: PrescribedExercise = {
      exercise_id: selectedExercise.id,
      sets: setsCount,
      target_reps: targetReps,
      rest_seconds: restSeconds,
      tempo: '2-0-1-0',
      role: exerciseRole,
      adaptation_action: 'ADD',
      estimated_duration_mins: estimatedAddedMins,
      notes_fa: `حرکت انتخابی کاربر (${selectedExercise.name_fa}) به عنوان حرکت ${exerciseRole === 'accessory' ? 'کمکی' : 'فینیشر'}.`
    };

    onAddExercise(newPrescribed);
    onClose();
  };

  const categories: { id: MuscleFilterCategory; label: string }[] = [
    { id: 'all', label: 'همه گروه‌ها' },
    { id: 'chest', label: 'سینه' },
    { id: 'back', label: 'پشت و زیربغل' },
    { id: 'legs', label: 'پا و باسن' },
    { id: 'shoulders', label: 'سرشانه' },
    { id: 'arms', label: 'بازو (جلو/پشت)' },
    { id: 'core', label: 'میان‌تنه و شکم' },
    { id: 'cardio', label: 'فینیشر / قلبی' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-right">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-orange-100 animate-fadeIn overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-orange-600 flex items-center justify-center text-white">
                <Plus className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-base font-black text-white">افزودن هوشمند حرکت به جلسه</h3>
            </div>
            <p className="text-[11px] text-slate-300">
              روز {day.day_number} (هفته {weekNumber}) — فیلترینگ بر اساس ۱۰ معیار ایمنی و تجهیزات شما
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Step 1: Exercise Selection (if none selected) */}
          {!selectedExercise ? (
            <div className="space-y-4">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="جستجوی نام حرکت (فارسی یا انگلیسی)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden transition"
                />
              </div>

              {/* Muscle Filters Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-[11px] ${
                      selectedCategory === cat.id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Compatible Exercises List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>حرکات سازگار و ایمن با پروفایل شما ({compatibleExercises.length})</span>
                  </span>
                  <span className="text-slate-400">کلیک برای انتخاب</span>
                </div>

                {compatibleExercises.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-1">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="font-bold">حرکت منطبق با این فیلتر یا تجهیزات شما یافت نشد.</p>
                    <p className="text-[10px]">فیلتر گروه عضلانی یا عبارت جستجو را تغییر دهید.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-0.5">
                    {compatibleExercises.map(({ exercise: ex }) => (
                      <div
                        key={ex.id}
                        onClick={() => setSelectedExercise(ex)}
                        className="p-3 rounded-2xl border border-slate-200 hover:border-orange-500 bg-white hover:bg-orange-50/40 transition cursor-pointer space-y-1.5 group text-right shadow-2xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-black text-slate-900 group-hover:text-orange-950 text-xs">
                            {ex.name_fa}
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                            مجاز
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{ex.name_en}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Dumbbell className="w-3 h-3 text-slate-400" />
                          <span>{ex.equipment.join('، ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incompatible Exercises List (Foldable / Greyed out for transparency) */}
              {incompatibleExercises.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block px-1">
                    حرکات غیرسازگار یا نیازمند تجهیزات دیگر ({incompatibleExercises.length})
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto opacity-75">
                    {incompatibleExercises.slice(0, 10).map(({ exercise: ex, reasonFa }) => (
                      <div
                        key={ex.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-slate-600 block">{ex.name_fa}</span>
                          <span className="text-[10px] text-rose-700">{reasonFa || 'ناسازگار با پروفایل'}</span>
                        </div>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                          غیرقابل افزودن
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Step 2: Configure Selected Exercise */
            <div className="space-y-5 animate-fadeIn">
              {/* Chosen Exercise Banner */}
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                    <h4 className="font-black text-sm text-slate-900">{selectedExercise.name_fa}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 block">{selectedExercise.name_en}</span>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      عضلات هدف: {selectedExercise.primary_muscles.join('، ')}
                    </span>
                    <span className="bg-white border border-orange-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      تجهیزات: {selectedExercise.equipment.join('، ')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-xs text-orange-700 hover:text-orange-950 font-bold underline cursor-pointer"
                >
                  تغییر حرکت
                </button>
              </div>

              {/* Configuration Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Sets */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-800 block">تعداد ست‌های تجویزی:</label>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSetsCount(s)}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition cursor-pointer ${
                          setsCount === s 
                            ? 'bg-orange-600 text-white shadow-xs' 
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {s} ست
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reps */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-800 block">دامنه تکرار هدف:</label>
                  <select
                    value={targetReps}
                    onChange={(e) => setTargetReps(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="6-8">۶ تا ۸ تکرار (تمرکز قدرت/هایپرتروفی)</option>
                    <option value="8-10">۸ تا ۱۰ تکرار (هایپرتروفی پایه)</option>
                    <option value="10-12">۱۰ تا ۱۲ تکرار (هایپرتروفی بهینه)</option>
                    <option value="12-15">۱۲ تا ۱۵ تکرار (استقامت عضلانی / پمپ)</option>
                    <option value="15-20">۱۵ تا ۲۰ تکرار (فینیشر متابولیک)</option>
                    <option value="30s">۳۰ ثانیه ایزومتریک</option>
                  </select>
                </div>

                {/* Rest Seconds */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-800 block">زمان استراحت بین ست‌ها:</label>
                  <select
                    value={restSeconds}
                    onChange={(e) => setRestSeconds(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value={45}>۴۵ ثانیه (تمرین پرچگالی)</option>
                    <option value={60}>۶۰ ثانیه (استاندارد هایپرتروفی)</option>
                    <option value={75}>۷۵ ثانیه</option>
                    <option value={90}>۹۰ ثانیه (ریکاوری کامل قدرت)</option>
                  </select>
                </div>

                {/* Role */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-800 block">بخش قرارگیری در جلسه:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExerciseRole('accessory')}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                        exerciseRole === 'accessory'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      حرکت کمکی (Accessory)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExerciseRole('finisher')}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                        exerciseRole === 'finisher'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      فینیشر / کور (Finisher)
                    </button>
                  </div>
                </div>

              </div>

              {/* Time Budget Impact Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isOverBudget ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-slate-900 text-white'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Clock className={`w-5 h-5 ${isOverBudget ? 'text-amber-600' : 'text-amber-400'}`} />
                  <div>
                    <span className="font-black block text-xs">
                      تاثیر بر بودجه زمانی جلسه: +{estimatedAddedMins} دقیقه
                    </span>
                    <span className="text-[11px] opacity-80 block">
                      مدت کل جلسه: {projectedDuration} دقیقه (بودجه مجاز: {targetBudget} دقیقه)
                    </span>
                  </div>
                </div>

                {isOverBudget && (
                  <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-1 rounded-lg">
                    نزدیک به سقف زمان
                  </span>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            انصراف
          </button>

          {selectedExercise && (
            <button
              onClick={handleConfirmAdd}
              className="px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-lg shadow-orange-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تایید و افزودن به جلسه {day.day_number}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
