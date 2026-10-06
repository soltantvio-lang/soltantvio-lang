import React, { useState } from 'react';
import { EXERCISES_DATABASE } from '../data/exercises';
import { Exercise, ExerciseCategory, FitnessLevel } from '../types';
import { 
  Search, 
  Dumbbell, 
  Filter, 
  X, 
  Play, 
  AlertTriangle, 
  ChevronLeft, 
  Sparkles,
  BookOpen
} from 'lucide-react';

export const EncyclopediaView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<Exercise | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'همه حرکات' },
    { id: 'chest', label: 'سینه' },
    { id: 'back', label: 'پشت / زیربغل' },
    { id: 'legs', label: 'پا و باسن' },
    { id: 'arms', label: 'بازو و پشت‌بازو' },
    { id: 'core', label: 'شکم و کور' },
  ];

  const filteredExercises = EXERCISES_DATABASE.filter(ex => {
    const matchesSearch = 
      ex.name_fa.includes(searchTerm) || 
      ex.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.primary_muscles.some(m => m.includes(searchTerm));

    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || ex.difficulty === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div dir="rtl" className="max-w-6xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl space-y-4 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <BookOpen className="w-4 h-4" />
          <span>بانک تخصصی آناتومی و حرکت‌شناسی فیت مکس</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">دانشنامه حرکات کلیستنیکس و فیتنس</h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          آموزش گام‌به‌گام نحوه اجرای صحیح حرکات، اشتباهات رایج جهت پیشگیری از آسیب، زنجیره پیشرفت (Progression) و جایگزین‌های هوشمند.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl pt-2">
          <Search className="w-5 h-5 absolute right-4 top-5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی حرکت (مثلاً: شنا، بارفیکس، اسکوات، سینه)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3.5 bg-slate-800/90 text-white placeholder-slate-400 rounded-2xl border border-slate-700 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* CATEGORY & LEVEL FILTERS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat.id 
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Level Selector */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-slate-500">سطح:</span>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 font-bold focus:border-orange-500 focus:outline-hidden"
          >
            <option value="all">همه سطوح</option>
            <option value="beginner">مبتدی</option>
            <option value="intermediate">متوسط</option>
            <option value="advanced">پیشرفته</option>
          </select>
        </div>
      </div>

      {/* EXERCISES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((ex) => (
          <div
            key={ex.id}
            onClick={() => setSelectedExerciseModal(ex)}
            className="bg-white rounded-2xl border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {ex.image_url ? (
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                  <img 
                    src={ex.image_url} 
                    alt={ex.name_fa} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {ex.difficulty === 'beginner' ? 'مبتدی' : ex.difficulty === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                  </span>
                </div>
              ) : (
                <div className="h-28 w-full bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4 text-orange-600">
                  <Dumbbell className="w-10 h-10 opacity-40" />
                </div>
              )}

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition">
                    {ex.name_fa}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium block">{ex.name_en}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-500 font-semibold block text-[11px]">عضلات اصلی:</span>
                  <div className="flex flex-wrap gap-1">
                    {ex.primary_muscles.map((m, idx) => (
                      <span key={idx} className="bg-orange-50 text-orange-800 text-[10px] px-2 py-0.5 rounded-md font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-orange-600">
              <span>مشاهده کامل بیومکانیک و آموزش</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            </div>
          </div>
        ))}
      </div>

      {/* EXERCISE DETAIL MODAL */}
      {selectedExerciseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedExerciseModal.name_fa}</h3>
                <span className="text-xs text-slate-500">{selectedExerciseModal.name_en}</span>
              </div>
              <button
                onClick={() => setSelectedExerciseModal(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Embed */}
            {selectedExerciseModal.youtube_embed_url && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
                <iframe
                  src={selectedExerciseModal.youtube_embed_url}
                  title={selectedExerciseModal.name_fa}
                  className="w-full h-full border-0"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 space-y-2">
                <span className="font-bold text-orange-900 block text-sm">نحوه اجرای صحیح:</span>
                <p>{selectedExerciseModal.instructions}</p>
                <p><strong>موقعیت شروع:</strong> {selectedExerciseModal.starting_position}</p>
                <p><strong>اجرا:</strong> {selectedExerciseModal.execution}</p>
                <p><strong>تنفس:</strong> {selectedExerciseModal.breathing}</p>
              </div>

              {/* Common Mistakes */}
              {selectedExerciseModal.common_mistakes.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>اشتباهات رایج (جلوگیری از آسیب):</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
                    {selectedExerciseModal.common_mistakes.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedExerciseModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                بستن
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
