import { YouTubeVideo } from '../types';

export const YOUTUBE_VIDEOS_DATABASE: YouTubeVideo[] = [
  // 1. آموزش‌های پایه و شروع کلیستنیکس
  {
    id: 'yt_starter_100',
    youtube_id: 'RMpaiLRWveo',
    title_fa: 'از صفر تا ۱۰۰ کلیستنیکس (قسمت ۱)',
    description_fa: 'بهترین نقطه شروع برای کسانی که می‌خواهند تمرین با وزن بدن و کنترل کامل بدن را شروع کنند.',
    category: 'starter',
    duration: '15:40',
    thumbnail_url: 'https://img.youtube.com/vi/RMpaiLRWveo/hqdefault.jpg',
    featured: true
  },
  {
    id: 'yt_starter_secrets',
    youtube_id: 'j3SnZFTBfQI',
    title_fa: 'چطور اولین حرکات کلیستنیکس رو بزنیم؟',
    description_fa: 'آموزش ۳ راز طلایی برای اجرای درست و بدون آسیب حرکات اصلی شنا، بارفیکس و اسکات.',
    category: 'starter',
    duration: '12:15',
    thumbnail_url: 'https://img.youtube.com/vi/j3SnZFTBfQI/hqdefault.jpg',
    related_exercise_ids: ['pushup_standard', 'pullup_standard', 'squat_bodyweight'],
    featured: true
  },
  {
    id: 'yt_starter_why_cali',
    youtube_id: '4ELO_G6EAiQ',
    title_fa: 'چرا کلیستنیکس از باشگاه بهتره؟',
    description_fa: 'ویدیو انگیزشی و تحلیلی درباره مزایای تمرین با وزن بدن، ساخت عضلات کاربردی و آزادی تمرین.',
    category: 'starter',
    duration: '10:50',
    thumbnail_url: 'https://img.youtube.com/vi/4ELO_G6EAiQ/hqdefault.jpg',
    featured: true
  },
  {
    id: 'yt_starter_test',
    youtube_id: 'y_L14s0kc5s',
    title_fa: 'تست قدرت: تا کدوم سطح شنا میتونی بری؟',
    description_fa: 'یک ویدیوی عالی برای ارزیابی سطح اولیه قدرت سینه و شانه و تعیین دقیق سطح آمادگی جسمانی.',
    category: 'starter',
    duration: '08:30',
    thumbnail_url: 'https://img.youtube.com/vi/y_L14s0kc5s/hqdefault.jpg',
    related_exercise_ids: ['pushup_standard'],
    featured: true
  },

  // 2. تخصص ساعد، مچ و پنجه (بخش رگدار کردن)
  {
    id: 'yt_forearm_30days',
    youtube_id: 'Tf0ULax6ifA',
    title_fa: 'راز ساعدهای رگدار: تمرین ۳۰ روزه',
    description_fa: 'برنامه کامل و انفجاری برای حجیم کردن عضلات مچ و ساخت ساعدهای رگدار در خانه و باشگاه.',
    category: 'forearms',
    duration: '14:20',
    thumbnail_url: 'https://img.youtube.com/vi/Tf0ULax6ifA/hqdefault.jpg',
    featured: true
  },
  {
    id: 'yt_forearm_3moves',
    youtube_id: '2dkQXbSgd7U',
    title_fa: 'فقط با ۳ حرکت ساده ساعد حجیم و رگدار بساز!',
    description_fa: 'تمرینات سریع و بسیار موثر برای کسانی که زمان کمی دارند اما ساعد قوی و حجیم می‌خواهند.',
    category: 'forearms',
    duration: '09:15',
    thumbnail_url: 'https://img.youtube.com/vi/2dkQXbSgd7U/hqdefault.jpg',
    featured: false
  },
  {
    id: 'yt_wrist_thick',
    youtube_id: 'zT3YhzU8Xsk',
    title_fa: 'مچ‌هات لاغره؟ ۳ حرکت برای ضخیم کردن مچ',
    description_fa: 'راهکار کاربردی و حرکات تخصصی برای کسانی که از استخوان‌بندی و مچ ظریف رنج می‌برند.',
    category: 'forearms',
    duration: '11:05',
    thumbnail_url: 'https://img.youtube.com/vi/zT3YhzU8Xsk/hqdefault.jpg',
    featured: false
  },
  {
    id: 'yt_hand_size',
    youtube_id: 'TdcJrtrYKtw',
    title_fa: 'کف دستت کوچیکه؟ ۳ تمرین برای کلفت کردن دست',
    description_fa: 'تمرینات خاص برای افزایش حجم گوشتی دست و تقویت هیپرتروفی عضلات پنجه.',
    category: 'forearms',
    duration: '08:45',
    thumbnail_url: 'https://img.youtube.com/vi/TdcJrtrYKtw/hqdefault.jpg',
    featured: false
  },
  {
    id: 'yt_grip_strength',
    youtube_id: 'gsiEFb5N4oE',
    title_fa: 'چرا قدرت پنجه‌هات ضعیفه؟',
    description_fa: 'اصلاح اشتباهات رایج در تمرینات پنجه و مچ و افزایش قدرت گیرایی دست (Grip Strength).',
    category: 'forearms',
    duration: '10:20',
    thumbnail_url: 'https://img.youtube.com/vi/gsiEFb5N4oE/hqdefault.jpg',
    featured: false
  },

  // 3. آموزش فرم صحیح (اصلاح تکنیک)
  {
    id: 'yt_technique_pushup',
    youtube_id: 'tc0mOEyWKLI',
    title_fa: 'چطور درست شنا بزنیم؟ (اشتباهات ۹۰٪ افراد)',
    description_fa: 'بررسی دقیق بیومکانیک و جزئیات فرم صحیح شنا سوئدی و اصلاح زاویه شانه و آرنج.',
    category: 'technique',
    duration: '13:10',
    thumbnail_url: 'https://img.youtube.com/vi/tc0mOEyWKLI/hqdefault.jpg',
    related_exercise_ids: ['pushup_standard'],
    featured: true
  },
  {
    id: 'yt_pushup_mistakes',
    youtube_id: 'dhhyQOST0QA',
    title_fa: '۵ اشتباه خطرناک در حرکت شنا',
    description_fa: 'ویدیوی تکمیلی برای جلوگیری از آسیب‌دیدگی مفصل شانه، مچ و گودی کمر هنگام اجرای شنا.',
    category: 'technique',
    duration: '07:45',
    thumbnail_url: 'https://img.youtube.com/vi/dhhyQOST0QA/hqdefault.jpg',
    related_exercise_ids: ['pushup_standard'],
    featured: false
  },
  {
    id: 'yt_pullup_form',
    youtube_id: '_B4OfVtlNqI',
    title_fa: 'فرم درست بارفیکس در ۲ دقیقه',
    description_fa: 'آموزش سریع و تخصصی برای کسانی که بارفیکس را اشتباه می‌زنند و قصد تقویت عضلات زیربغل را دارند.',
    category: 'technique',
    duration: '02:30',
    thumbnail_url: 'https://img.youtube.com/vi/_B4OfVtlNqI/hqdefault.jpg',
    related_exercise_ids: ['pullup_standard'],
    featured: false
  },
  {
    id: 'yt_neck_hump',
    youtube_id: 'V3XnZiwlqaA',
    title_fa: 'قوز گردن داری؟ اصلاح در ۲ دقیقه',
    description_fa: 'تمرینات اصلاحی پاسچرال برای بهبود وضعیت گردن، شانه رو به جلو و قوز پشتی.',
    category: 'technique',
    duration: '02:45',
    thumbnail_url: 'https://img.youtube.com/vi/V3XnZiwlqaA/hqdefault.jpg',
    featured: false
  },

  // 4. افزایش رکورد و قدرت (چالش‌ها)
  {
    id: 'yt_challenge_100pushups',
    youtube_id: 'vq0HXELEZj8',
    title_fa: '۱۰۰ تا شنا سوئدی پشت سر هم!',
    description_fa: 'تمرینات و تکنیک‌های مخفی جهش عصبی-عضلانی برای افزایش چشمگیر تعداد شنا.',
    category: 'challenges',
    duration: '16:30',
    thumbnail_url: 'https://img.youtube.com/vi/vq0HXELEZj8/hqdefault.jpg',
    related_exercise_ids: ['pushup_standard'],
    featured: true
  },
  {
    id: 'yt_challenge_25pullups',
    youtube_id: '-no3dx_Fa7Q',
    title_fa: 'چطور از ۳ بارفیکس به ۲۵ تا برسیم!',
    description_fa: 'متد علمی و سیستم‌های تمرینی کاربردی که باعث جهش فوق‌العاده در رکورد بارفیکس می‌شود.',
    category: 'challenges',
    duration: '15:15',
    thumbnail_url: 'https://img.youtube.com/vi/-no3dx_Fa7Q/hqdefault.jpg',
    related_exercise_ids: ['pullup_standard'],
    featured: true
  },
  {
    id: 'yt_challenge_30day_pushup',
    youtube_id: '01Gw8TMw2uw',
    title_fa: 'چی میشه اگه ۳۰ روز، هر روز ۱۰۰ تا شنا بزنی؟',
    description_fa: 'بررسی علمی، تجربی و آناتومیک نتایج و عوارض چالش‌های سنگین شنا زدن روزانه.',
    category: 'challenges',
    duration: '12:40',
    thumbnail_url: 'https://img.youtube.com/vi/01Gw8TMw2uw/hqdefault.jpg',
    related_exercise_ids: ['pushup_standard'],
    featured: false
  },

  // 5. تغذیه و مکمل‌ها (آشپزخانه فیت مکس)
  {
    id: 'yt_nutrition_budget',
    youtube_id: 'Nk4eLcHLLu0',
    title_fa: 'برنامه غذایی ارزان برای فقر مکمل!',
    description_fa: 'راهنمای جامع تغذیه اقتصادی، پروتئین ارزان و رژیم پرقدرت بدون نیاز به مکمل‌های گران.',
    category: 'nutrition',
    duration: '18:20',
    thumbnail_url: 'https://img.youtube.com/vi/Nk4eLcHLLu0/hqdefault.jpg',
    featured: true
  },
  {
    id: 'yt_whey_experiment',
    youtube_id: 'LWplmZZjGVo',
    title_fa: 'یک سال هر روز پروتئین وی خوردم!',
    description_fa: 'تجربه شخصی، بررسی آزمایشگاهی و نتایج واقعی مصرف مداوم مکمل پروتئین وی طی یک سال.',
    category: 'nutrition',
    duration: '14:50',
    thumbnail_url: 'https://img.youtube.com/vi/LWplmZZjGVo/hqdefault.jpg',
    featured: false
  },
  {
    id: 'yt_no_sugar_1year',
    youtube_id: 'ABrFMSaG1lA',
    title_fa: 'حذف شکر به مدت یک سال',
    description_fa: 'معجزات شگفت‌انگیز قطع قند مصنوعی در ترکیب بدنی، چربی‌سوزی شکم و شادابی پوست.',
    category: 'nutrition',
    duration: '13:15',
    thumbnail_url: 'https://img.youtube.com/vi/ABrFMSaG1lA/hqdefault.jpg',
    featured: false
  },

  // 6. لایف‌استایل و هورمون‌ها
  {
    id: 'yt_lifestyle_testosterone',
    youtube_id: 'ACAD8vCqQLU',
    title_fa: '۹ راه طبیعی افزایش تستوسترون',
    description_fa: 'راهکارهای علمی و اثبات‌شده برای افزایش طبیعی هورمون مردانه بدون نیاز به داروها.',
    category: 'lifestyle',
    duration: '17:40',
    thumbnail_url: 'https://img.youtube.com/vi/ACAD8vCqQLU/hqdefault.jpg',
    featured: true
  },
  {
    id: 'yt_lifestyle_nofap',
    youtube_id: 'C5t6WxnjzcY',
    title_fa: 'اگه خود ارضایی رو ترک کنی چه اتفاقی میفته؟',
    description_fa: 'بررسی علمی تاثیرات ترک عادت بر سیستم دوپامین، انرژی بدن، جذابیت و عملکرد ورزشی.',
    category: 'lifestyle',
    duration: '15:10',
    thumbnail_url: 'https://img.youtube.com/vi/C5t6WxnjzcY/hqdefault.jpg',
    featured: false
  },
  {
    id: 'yt_lifestyle_height',
    youtube_id: 'CAFRykU8wLg',
    title_fa: 'افزایش قد تا حداکثر ژنتیک',
    description_fa: 'عادات تمرینی، وضعیت خواب و رژیم غذایی برای دست‌یابی به حداکثر پتانسیل رشد قد.',
    category: 'lifestyle',
    duration: '11:30',
    thumbnail_url: 'https://img.youtube.com/vi/CAFRykU8wLg/hqdefault.jpg',
    featured: false
  },
  {
    id: 'yt_lifestyle_depression',
    youtube_id: 'lM2C83O7ZcQ',
    title_fa: 'راز ۷ روزه‌ای که افسردگی رو نابود میکنه',
    description_fa: 'ارتباط عمیق بین سلامت روان، فعالیت بدنی منظم کلیستنیکس و رفع افسردگی و بی‌انگیزگی.',
    category: 'lifestyle',
    duration: '13:50',
    thumbnail_url: 'https://img.youtube.com/vi/lM2C83O7ZcQ/hqdefault.jpg',
    featured: false
  }
];
