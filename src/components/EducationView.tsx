import React, { useState, useEffect } from 'react';
import { ARTICLES_DATABASE } from '../data/articles';
import { YOUTUBE_VIDEOS_DATABASE } from '../data/youtubeVideos';
import { Article, YouTubeVideo } from '../types';
import { 
  Flame, Youtube, BookOpen, MessageSquare, Clock, ExternalLink, Filter, 
  Rocket, Dumbbell, ShieldCheck, Trophy, Utensils, Brain, ArrowLeft,
  Sparkles, CheckCircle2
} from 'lucide-react';

export const EducationView: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'articles' | 'videos'>('videos');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(ARTICLES_DATABASE[0]);
  
  // YouTube state
  const [videosList, setVideosList] = useState<YouTubeVideo[]>(YOUTUBE_VIDEOS_DATABASE);
  const [selectedVideoCategory, setSelectedVideoCategory] = useState<string>('all');

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentNotice, setCommentNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/youtube')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setVideosList(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedArticle) {
      fetch(`/api/comments?article_id=${selectedArticle.id}&status=approved`)
        .then(res => res.json())
        .then(data => setComments(data))
        .catch(() => {});
    }
  }, [selectedArticle]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim() || !selectedArticle) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: selectedArticle.id,
          user_name: commentName,
          content: commentText
        })
      });
      const data = await res.json();
      setCommentNotice(data.message || 'دیدگاه شما ثبت شد و پس از بررسی منتشر می‌شود.');
      setCommentText('');
    } catch (err) {
      setCommentNotice('خطا در ثبت دیدگاه.');
    }
  };

  // Structured topic modules
  const videoModules = [
    {
      id: 'starter',
      title: '۱. آموزش‌های پایه و شروع کلیستنیکس',
      subtitle: 'نقشه راه مبتدیان و اصول پایه',
      badge: 'نقشه راه مبتدیان',
      icon: Rocket,
      accentColor: 'from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/30 text-emerald-400',
      tagBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      description: 'بهترین نقطه شروع برای کسانی که می‌خواهند بدون نیاز به تجهیزات، تمرینات کالیستنیکس و ساخت فیزیک عضلانی را شروع کنند.'
    },
    {
      id: 'forearms',
      title: '۲. تخصص ساعد، مچ و پنجه',
      subtitle: 'برنامه‌های حجم‌دهی، رگدار کردن و تقویت مچ',
      badge: 'بخش رگدار کردن',
      icon: Dumbbell,
      accentColor: 'from-amber-950/80 via-slate-900 to-slate-900 border-amber-500/30 text-amber-400',
      tagBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      description: 'محبوب‌ترین بخش آموزشی شامل تمرینات تخصصی افزایش حجم ساعد، کلفت کردن مچ‌های ظریف و رگدار کردن دست‌ها.'
    },
    {
      id: 'technique',
      title: '۳. آموزش فرم صحیح و بیومکانیک',
      subtitle: 'اصلاح تکنیک حرکات و رفع پاسچر ناصحیح',
      badge: 'اصلاح تکنیک',
      icon: ShieldCheck,
      accentColor: 'from-sky-950/80 via-slate-900 to-slate-900 border-sky-500/30 text-sky-400',
      tagBg: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
      description: 'بررسی بیومکانیک شنا، بارفیکس و اسکات، جلوگیری از آسیب‌دیدگی مفاصل و ویدیوهای اصلاح قوز گردن و شانه.'
    },
    {
      id: 'challenges',
      title: '۴. افزایش رکورد، قدرت و چالش‌ها',
      subtitle: 'متدهای ساخت قدرت انفجاری و چالش‌های ۳۰ روزه',
      badge: 'چالش ۳۰ روزه',
      icon: Trophy,
      accentColor: 'from-red-950/80 via-slate-900 to-slate-900 border-red-500/30 text-red-400',
      tagBg: 'bg-red-500/10 text-red-600 border-red-500/20',
      description: 'برنامه‌ها و متدهای جهش رکورد برای رسیدن به ۱۰۰ شنا سوئدی و ۲۵ بارفیکس متوالی و آنالیز چالش‌های سنگین.'
    },
    {
      id: 'nutrition',
      title: '۵. تغذیه، مکمل‌ها و رژیم اقتصادی',
      subtitle: 'آشپزخانه فیت مکس و رژیم‌های بدون مکمل',
      badge: 'آشپزخانه فیت مکس',
      icon: Utensils,
      accentColor: 'from-purple-950/80 via-slate-900 to-slate-900 border-purple-500/30 text-purple-400',
      tagBg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      description: 'برنامه‌های غذایی ارزان برای فقر مکمل، بررسی آزمایشگاهی پروتئین وی و معجزات حذف شکر مصنوعی.'
    },
    {
      id: 'lifestyle',
      title: '۶. لایف‌استایل، هورمون‌ها و سلامت روان',
      subtitle: 'دستیار هوشمند سلامتی، تستوسترون و رشد',
      badge: 'دستیار هوشمند و مقالات',
      icon: Brain,
      accentColor: 'from-indigo-950/80 via-slate-900 to-slate-900 border-indigo-500/30 text-indigo-400',
      tagBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      description: 'راهکارهای افزایش طبیعی هورمون تستوسترون، ترک عادات مخرب، پتانسیل حداکثری رشد قد و غلبه بر افسردگی.'
    }
  ];

  const filteredModules = selectedVideoCategory === 'all'
    ? videoModules
    : videoModules.filter(m => m.id === selectedVideoCategory);

  return (
    <div dir="rtl" className="max-w-5xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-4 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <Flame className="w-4 h-4" />
          <span>مرجع آموزشی Fit Max | کینکس بادی</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">آکادمی آموزش‌های تصویری، یوتیوب و مقالات علمی</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          آموزش‌های ویدیویی کانال یوتیوب فیت مکس در ۶ دسته اختصاصی و دسته‌بندی‌شده همراه با مقالات تخصصی فیزیولوژی ورزشی.
        </p>

        {/* Sub tabs */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => setSelectedTab('videos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTab === 'videos' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Youtube className="w-4 h-4 text-white" />
            <span>آموزش‌های تصویری یوتیوب ({videosList.length} ویدیو در ۶ بخش)</span>
          </button>
          <button
            onClick={() => setSelectedTab('articles')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTab === 'articles' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>مقالات تخصصی متنی ({ARTICLES_DATABASE.length})</span>
          </button>
        </div>
      </div>

      {selectedTab === 'articles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Article List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500">فهرست مقالات علمی:</h3>
            <div className="space-y-3">
              {ARTICLES_DATABASE.map((art) => {
                const isSelected = selectedArticle?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => {
                      setSelectedArticle(art);
                      setCommentNotice(null);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                      isSelected 
                        ? 'bg-orange-50 border-orange-300 shadow-2xs' 
                        : 'bg-white border-slate-200 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>{art.category_fa}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {art.read_time_minutes} دقیقه</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{art.title_fa}</h4>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Article Full View & Comments */}
          <div className="lg:col-span-8 space-y-8">
            {selectedArticle && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-6">
                
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                    {selectedArticle.category_fa}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">{selectedArticle.title_fa}</h2>
                  <p className="text-xs text-slate-500">نویسنده: {selectedArticle.author}</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
                  {selectedArticle.content_fa}
                </div>

                {/* Key Takeaways */}
                {selectedArticle.key_takeaways.length > 0 && (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 space-y-2 text-xs">
                    <span className="font-bold text-orange-900 block text-sm">جمع‌بندی و نکات کلیدی:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {selectedArticle.key_takeaways.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Comments Section */}
                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span>دیدگاه‌ها و پرسش‌های کاربران</span>
                  </div>

                  {commentNotice && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                      {commentNotice}
                    </div>
                  )}

                  {/* Comment List */}
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{c.user_name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{new Date(c.created_at).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Submit Comment Form */}
                  <form onSubmit={handleSubmitComment} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="font-bold text-xs text-slate-800 block">ارسال دیدگاه جدید:</span>
                    <input
                      type="text"
                      placeholder="نام شما..."
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                    />
                    <textarea
                      placeholder="نظر یا سوال شما درباره این مقاله..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                    ></textarea>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      ثبت دیدگاه
                    </button>
                  </form>

                </div>

              </div>
            )}
          </div>

        </div>
      ) : (
        /* YOUTUBE CATEGORIZED MODULES */
        <div className="space-y-8">
          
          {/* CATEGORY FILTER BAR */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-600" />
                <span>انتخاب بخش و موضوع آموزش‌ها:</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">کلیک کنید تا به موضوع مربوطه هدایت شوید</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVideoCategory('all')}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedVideoCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>نمایش همه بخش‌های ۶‌گانه</span>
              </button>

              {videoModules.map((mod) => {
                const IconComp = mod.icon;
                const isSelected = selectedVideoCategory === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedVideoCategory(mod.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{mod.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RENDER TOPIC MODULE SECTIONS */}
          <div className="space-y-12">
            {filteredModules.map((module) => {
              const IconComponent = module.icon;
              const moduleVideos = videosList.filter(v => v.category === module.id);

              return (
                <section key={module.id} className="space-y-5">
                  
                  {/* MODULE HEADER BANNER */}
                  <div className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-r ${module.accentColor} border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-white`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                          {module.badge}
                        </span>
                        <span className="text-[11px] text-slate-300 font-bold">
                          ({moduleVideos.length} ویدیو آموزشی)
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black">{module.title}</h2>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                        {module.description}
                      </p>
                    </div>

                    <a
                      href="https://youtube.com/@fitmaxofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shrink-0 shadow-md"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>مشاهده کامل در کانال یوتیوب</span>
                    </a>
                  </div>

                  {/* VIDEOS GRID FOR THIS MODULE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {moduleVideos.map((video) => (
                      <div 
                        key={video.id} 
                        className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition group"
                      >
                        <div>
                          <div className="aspect-video w-full bg-slate-950 relative">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.youtube_id}`}
                              title={video.title_fa}
                              className="w-full h-full border-0"
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${module.tagBg}`}>
                                {module.badge}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> کانال رسمی فیت مکس
                              </span>
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-red-600 transition">
                              {video.title_fa}
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">{video.description_fa}</p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-red-600 font-bold hover:underline"
                          >
                            <Youtube className="w-4 h-4" />
                            <span>تماشا مستقیماً در یوتیوب</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {moduleVideos.length === 0 && (
                    <div className="text-center py-8 bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
                      <p className="text-xs font-bold">هنوز ویدیویی برای این بخش ثبت نشده است.</p>
                    </div>
                  )}

                </section>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
