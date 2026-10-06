import React from 'react';
import { 
  Sparkles, 
  Dumbbell, 
  Brain, 
  Flame, 
  Calculator, 
  Trophy, 
  ArrowLeft, 
  CheckCircle2, 
  Youtube, 
  Play,
  Zap,
  BookOpen
} from 'lucide-react';
import { FitMaxMascot } from './FitMaxMascot';
import { YOUTUBE_VIDEOS_DATABASE } from '../data/youtubeVideos';
import { EXERCISES_DATABASE } from '../data/exercises';
import { NavTab } from './Navbar';

interface HomeSectionProps {
  setActiveTab: (tab: NavTab) => void;
  hasAssessment: boolean;
}

export const HomeSection: React.FC<HomeSectionProps> = ({ setActiveTab, hasAssessment }) => {
  const featuredVideos = YOUTUBE_VIDEOS_DATABASE.filter(v => v.featured);
  const featuredExercises = EXERCISES_DATABASE.filter(e => e.is_featured).slice(0, 4);

  return (
    <div dir="rtl" className="space-y-16 pb-12 animate-fadeIn">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 text-white p-8 md:p-14 shadow-lg">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-white border border-white/30">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>پلتفرم رسمی همراه کانال یوتیوب Fit Max</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
              بدنت رو <span className="text-amber-200 underline decoration-amber-400 decoration-4 underline-offset-8">هوشمندانه</span> بساز.
            </h1>

            <p className="text-base sm:text-lg text-orange-50/90 leading-relaxed max-w-2xl font-medium">
              برنامه تمرینی اختصاصی، آموزش دقیق علمی حرکات و مسیر پیشرفت؛ متناسب با بدن، هدف و امکانات تو (کلیستنیکس، تمرین خانگی یا باشگاه).
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab(hasAssessment ? 'workout' : 'assessment')}
                className="flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 text-sm"
              >
                <span>{hasAssessment ? 'مشاهده برنامه تمرینی من' : 'ارزیابی رایگان و دریافت برنامه'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('encyclopedia')}
                className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white font-bold px-5 py-3.5 rounded-xl border border-white/30 transition text-sm"
              >
                <Dumbbell className="w-4 h-4 text-amber-300" />
                <span>بانک حرکات و تکنیک‌ها</span>
              </button>
            </div>

            {/* Quick Proof Pills */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-white/20 text-xs">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span>۱۰۰٪ برنامه رایگان</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span>مبتنی بر شواهد علمی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span>جایگزینی هوشمند حرکات</span>
              </div>
            </div>
          </div>

          {/* Fit Max Mascot Highlight */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-2xl"></div>
              <FitMaxMascot pose="welcome" size="xl" caption="خوش‌آمدی! آماده‌ای تمرین علمی رو شروع کنی؟" />
            </div>
          </div>

        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            امکانات پلتفرم هوشمند فیت مکس
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            هر آنچه برای رسیدن به فیزیک ایده‌آل و ارتقای عملکرد ورزشی نیاز داری در یک جا
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Assessment */}
          <div 
            onClick={() => setActiveTab('assessment')}
            className="group bg-white p-6 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition">
                ارزیابی هوشمند و شناسنامه ورزشی
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                سنجش سطح آمادگی، توان حرکتی، امکانات خانه یا باشگاه و محدودیت‌ها جهت طراحی برنامه اختصاصی.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-orange-600 gap-1">
              <span>شروع ارزیابی رایگان</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: AI Coach */}
          <div 
            onClick={() => setActiveTab('aicoach')}
            className="group bg-white p-6 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition">
                مربی هوشمند AI Coach
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                پاسخگویی ۲۴ ساعته به سوالات تمرینی، اصلاح تکنیک، جایگزینی حرکت و برنامه‌ریزی تغذیه.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-amber-700 gap-1">
              <span>گفتگو با مربی</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Encyclopedia */}
          <div 
            onClick={() => setActiveTab('encyclopedia')}
            className="group bg-white p-6 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition">
                بانک جامع حرکات و آناتومی
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                آموزش گام‌به‌گام شنا، بارفیکس، اسکوات و دیپس با اشتباهات رایج و ویدیوهای تعاملی.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-emerald-700 gap-1">
              <span>مشاهده حرکات</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
            </div>
          </div>

          {/* Card 4: Calorie Calculator */}
          <div 
            onClick={() => setActiveTab('nutrition')}
            className="group bg-white p-6 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition">
                محاسبه‌گر کالری و TDEE
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                محاسبه دقیق متابولیسم پایه (BMR)، کالری روزانه و درشت‌مغذی‌های پروتئین، کربوهیدرات و چربی.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-sky-700 gap-1">
              <span>محاسبه کالری</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
            </div>
          </div>

        </div>
      </section>

      {/* EMBEDDED YOUTUBE HIGHLIGHTS */}
      <section className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
              <Youtube className="w-5 h-5" />
              <span>ویدیوهای برتر کانال یوتیوب Fit Max</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">آموزش‌های تصویری و علمی یوتیوب</h2>
          </div>
          <a
            href="https://youtube.com/@fitmaxofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition"
          >
            <span>عضویت در کانال یوتیوب</span>
            <ArrowLeft className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredVideos.map((video) => (
            <div key={video.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-md flex flex-col justify-between">
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_id}`}
                  title={video.title_fa}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-orange-400 font-semibold">
                  <span className="bg-slate-700 px-2.5 py-1 rounded-full text-slate-300">ویدیو رسمی یوتیوب Fit Max</span>
                </div>
                <h3 className="font-bold text-base text-white">{video.title_fa}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{video.description_fa}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR EXERCISES PREVIEW */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">محبوب‌ترین حرکات کلیستنیکس</h2>
            <p className="text-xs text-slate-500">اجرای اصولی با استفاده از وزنه بدن</p>
          </div>
          <button
            onClick={() => setActiveTab('encyclopedia')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>مشاهده همه حرکات</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredExercises.map((ex) => (
            <div 
              key={ex.id}
              onClick={() => setActiveTab('encyclopedia')}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              {ex.image_url && (
                <div className="h-40 w-full overflow-hidden bg-slate-100 relative">
                  <img src={ex.image_url} alt={ex.name_fa} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {ex.difficulty === 'beginner' ? 'مبتدی' : ex.difficulty === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                  </span>
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">{ex.name_fa}</h3>
                <p className="text-[11px] text-slate-500">{ex.name_en}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {ex.primary_muscles.map((muscle, idx) => (
                    <span key={idx} className="bg-orange-50 text-orange-700 text-[10px] px-2 py-0.5 rounded-md font-medium">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl p-8 text-center space-y-6 shadow-md">
        <FitMaxMascot pose="celebration" size="lg" />
        <div className="max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black">همین امروز اولین گام ساخت فیزیکت رو بردار!</h2>
          <p className="text-xs sm:text-sm text-orange-100">
            بدون نیاز به پرداخت هزینه؛ ارزیابی هوشمند فیت مکس رو انجام بده و برنامه تمرینی کاملاً اختصاصی خودت رو دریافت کن.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('assessment')}
          className="bg-white text-orange-700 hover:bg-orange-50 font-black px-8 py-3.5 rounded-xl text-sm shadow-md transition"
        >
          شروع ارزیابی ۵ دقیقه‌ای
        </button>
      </section>

    </div>
  );
};
