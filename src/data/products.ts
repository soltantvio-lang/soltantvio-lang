import { Challenge, Product } from '../types';

export const CHALLENGES_DATABASE: Challenge[] = [
  {
    id: 'ch_pullup_30days',
    title_fa: 'چالش ۳۰ روز تا اولین بارفیکس کامل',
    description_fa: 'برنامه مرحله به مرحله روزانه برای کسانی که می‌خواهند از صفر به اولین بارفیکس کامل و صحیح برسند.',
    duration_days: 30,
    category: 'pullup',
    badge_icon: '🎯',
    daily_tasks: [
      { day: 1, title_fa: 'روز ۱: تست آویزان شدن ایزومتریک (Dead Hang)', instructions_fa: '۳ ست ۲۰ ثانیه‌ای آویزان شدن از میله بارفیکس جهت تقویت گریپ و مچ دست.', exercise_ids: ['row_doorframe'] },
      { day: 2, title_fa: 'روز ۲: زیربغل چارچوب در / استرالیایی', instructions_fa: '۳ ست ۱۰ تکرار شنا خوابیده یا کشش در.', exercise_ids: ['row_australian'] },
      { day: 3, title_fa: 'روز ۳: استراحت فعال و کشش شانه', instructions_fa: 'کشش عضلات زیربغل و شانه به مدت ۱۰ دقیقه.', exercise_ids: [] },
      { day: 4, title_fa: 'روز ۴: بارفیکس منفی کند', instructions_fa: '۴ ست ۳ تکراری بارفیکس منفی با ۵ ثانیه پایین آمدن.', exercise_ids: ['pullup_negative'] },
      { day: 5, title_fa: 'روز ۵: تقویت کور و هالو بادی', instructions_fa: '۳ ست ۲۰ ثانیه هالو بادی روی زمین.', exercise_ids: ['hollow_body_hold'] }
    ]
  },
  {
    id: 'ch_pushup_7days',
    title_fa: 'چالش ۷ روزه افزایش حجم سینه با شنا',
    description_fa: 'تقویت استقامت عضلانی سینه و پشت بازو با زوایای مختلف شنا سوئدی.',
    duration_days: 7,
    category: 'pushup',
    badge_icon: '🔥',
    daily_tasks: [
      { day: 1, title_fa: 'روز ۱: تست حداکثر شنا', instructions_fa: 'ثبت حداکثر شنای صحیح در یک ست.', exercise_ids: ['pushup_standard'] },
      { day: 2, title_fa: 'روز ۲: شنای شیب‌دار و الماسی', instructions_fa: '۳ ست ۱۰ تکراری شنا شیب‌دار + ۲ ست شنا الماسی روی زانو.', exercise_ids: ['pushup_incline', 'pushup_diamond'] }
    ]
  }
];

export const PRODUCTS_DATABASE: Product[] = [
  {
    id: 'prod_course_calisthenics_master',
    title_fa: 'دوره جامع مسترکلاس کلیستنیکس و کنترل بدن',
    description_fa: 'دوره ویدیویی پیشرفته شامل آموزش فرانت لور، هدف‌گذاری پرچمی، بالانس و تکنیک‌های پیشرفته قدرتی کلیستنیکس.',
    price_toman: 490000,
    is_free: false,
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    features_fa: ['بیش از ۱۰ ساعت ویدیو HD', 'برنامه تمرینی اختصاصی PDF', 'پشتیبانی مستقیم تلگرام'],
    category: 'course'
  },
  {
    id: 'prod_ebook_nutrition_science',
    title_fa: 'کتاب الکترونیکی علم رژیم و فیتنس بدون گرسنگی',
    description_fa: 'راهنمای عملی محاسبه درشت‌مغذی‌ها، انتخاب مواد غذایی ایرانی، رژیم چربی‌سوزی ماندگار و مکمل‌شناسی با استناد به تحقیقات روز.',
    price_toman: 190000,
    is_free: false,
    image_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
    features_fa: ['فرمت PDF تعاملی', 'جدول ارزش غذایی غذاهای ایرانی', 'محاسبه‌گر اکسل همراه'],
    category: 'ebook'
  }
];
