import express from "express";
import path from "path";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { authRouter } from "./server/auth.js";
import { apiRouter } from "./server/routes.js";

dotenv.config();

const PORT = 3000;
const ADMIN_ACCESS_PATH = process.env.ADMIN_ACCESS_PATH || "/fitmax-manage-portal-99x";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for SHA-256 password hashing
function hashPassword(pass: string): string {
  return crypto.createHash("sha256").update(pass + "fitmax_secret_salt_2026").digest("hex");
}

// ---------------------------------------------------------
// IN-MEMORY ADMIN & DOMAIN STORES
// ---------------------------------------------------------

// Admin Account (Initial default: admin / 1234)
let adminCredentials = {
  username: "admin",
  passwordHash: hashPassword("1234"),
};

// Active Session Tokens: { [token: string]: { username: string; expiresAt: number } }
let activeSessions: Record<string, { username: string; expiresAt: number }> = {};

// Activity Logs
let activityLogs: any[] = [
  {
    id: "log_init",
    adminUser: "system",
    action: "راه‌اندازی سیستم مدیریت",
    target: "Fit Max Admin",
    timestamp: new Date().toISOString(),
    details: "پلتفرم مدیریت فیت مکس با موفقیت فعال گردید."
  }
];

function logAdminActivity(username: string, action: string, target: string, details: string) {
  activityLogs.unshift({
    id: `log_${Date.now()}_${Math.floor(Math.random()*1000)}`,
    adminUser: username,
    action,
    target,
    timestamp: new Date().toISOString(),
    details
  });
}

// Site Settings Store
let siteSettings = {
  siteName: "FIT MAX | فیت مکس",
  logoUrl: "/images/site/logo.png",
  faviconUrl: "/favicon.ico",
  siteDescription: "پلتفرم علمی، آموزشی و تخصصی کلیستنیکس، تمرینات وزن بدن و بدنسازی. همراه رسمی کانال یوتیوب Fit Max.",
  youtubeUrl: "https://youtube.com/@fitmaxofficial",
  telegramAdminHandle: "@FitMax_Admin",
  contactPhone: "۰۲۱-۸۸۹۹۰۰۱۱",
  contactEmail: "info@fitmaxofficial.ir",
  footerText: "© ۲۰۲۶ FIT MAX | تمامی حقوق مادی و معنوی محفوظ است.",
  socialLinks: [
    { platform: "youtube", url: "https://youtube.com/@fitmaxofficial" },
    { platform: "telegram", url: "https://t.me/FitMaxOfficial1" }
  ]
};

// Typography Settings Store
let typographySettings = {
  headerFont: "Vazirmatn",
  bodyFont: "Vazirmatn",
  buttonFont: "Vazirmatn",
  cardFont: "Vazirmatn",
  fontSizeScale: "normal"
};

// Appearance Settings Store
let appearanceSettings = {
  primaryColor: "#f97316", // Brand Orange
  secondaryColor: "#ea580c",
  backgroundColor: "#ffead9", // Soft Peach
  textColor: "#0f172a",
  cardColor: "#ffffff",
  borderColor: "#ffead9",
  accentColor: "#ef4444"
};

// Banners Store
let heroBanners = [
  {
    id: "ban_1",
    title_fa: "کلیستنیکس و کنترل کامل بدن را علمی شروع کن",
    description_fa: "برنامه تمرینی اختصاصی بدون نیاز به تجهیزات گران‌قیمت با ارزیابی هوشمند سطوح حرکتی.",
    image_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    button_text: "شروع ارزیابی رایگان",
    button_link: "assessment",
    is_active: true,
    display_order: 1
  }
];

// Pages Content Store
let pagesContent: Record<string, any> = {
  home: {
    page_slug: "home",
    page_title_fa: "صفحه اصلی - فیت مکس",
    meta_description_fa: "خانه اصلی پلتفرم کلیستنیکس فیت مکس",
    sections: [
      { id: "s1", section_key: "hero", title_fa: "بخش هیرو و خیر مقدم", content_fa: "آموزش تخصصی کلیستنیکس با کاراکتر رسمی فیت مکس", is_active: true, display_order: 1 },
      { id: "s2", section_key: "features", title_fa: "ویژگی‌های پلتفرم", content_fa: "برنامه هوشمند، بانک حرکات، مربی هوشمند AI", is_active: true, display_order: 2 }
    ]
  },
  workout: {
    page_slug: "workout",
    page_title_fa: "برنامه تمرینی من",
    meta_description_fa: "برنامه اختصاصی کلیستنیکس و بدنسازی",
    sections: [
      { id: "s1", section_key: "program_overview", title_fa: "خلاصه برنامه", content_fa: "مشاهده برنامه هفتگی بر اساس ارزیابی شما", is_active: true, display_order: 1 }
    ]
  }
};

// Comments Store
let pendingComments: any[] = [
  {
    id: "c_1",
    article_id: "art_progressive_overload",
    user_name: "علی رضایی",
    content: "ممنون از مقاله عالی. برای کسانی که فقط با وزن بدن تمرین می‌کنند، تغییر زاویه حرکت واقعاً معجزه می‌کنه.",
    created_at: new Date().toISOString(),
    status: "approved"
  },
  {
    id: "c_2",
    article_id: "art_pullup_progression",
    user_name: "سارا حسینی",
    content: "با کمک چالش ۳۰ روزه به اولین بارفیکس کامل رسیدم! واقعاً ممنونم از آموزش‌های عالی یوتیوب فیت مکس.",
    created_at: new Date().toISOString(),
    status: "pending"
  }
];

// Media Files Store
let mediaFiles: any[] = [
  {
    id: "med_1",
    filename: "fitmax_character.jpg",
    folder: "character",
    url: "/images/character/fitmax_mascot.jpg",
    alt_text: "کاراکتر رسمی فیت مکس با هدبند قرمز FM",
    created_at: new Date().toISOString(),
    size_kb: 240
  },
  {
    id: "med_2",
    filename: "pushup_demo.jpg",
    folder: "exercises",
    url: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80",
    alt_text: "اجرای صحیح شنا سوئدی",
    created_at: new Date().toISOString(),
    size_kb: 180
  }
];

// AI Coach Knowledge Store
let aiCoachKnowledge: any[] = [
  {
    id: "ak_1",
    title_fa: "اصل اضافه بار تدریجی (Progressive Overload)",
    category: "exercise_science",
    content_fa: "در کلیستنیکس اضافه بار با تغییر زاویه بدنی، افزایش زمان تحت فشار (TUT)، کاهش زمان استراحت یا افزودن وزن جلیقه انجام می‌شود.",
    sources: ["ACSM Essentials of Strength Training", "Fit Max Methodology"],
    is_active: true
  },
  {
    id: "ak_2",
    title_fa: "پروتکل ایمنی مفاصل شانه و مچ دست",
    category: "safety",
    content_fa: "قبل از حرکات پیشرفته مثل دیپس یا بالانس، حتماً ۵ دقیقه گرم کردن اختصاصی مچ دست و روتاتور کاف انجام شود.",
    sources: ["NSCA Guidelines"],
    is_active: true
  }
];

// Users Store
let registeredUsers: any[] = [
  {
    id: "usr_1",
    name: "رضا محمدی",
    email: "reza@example.com",
    phone: "09121112233",
    status: "active",
    registeredAt: "2026-01-10",
    goal: "افزایش حجم و قدرت کلیستنیکس",
    calculatedLevel: "intermediate"
  },
  {
    id: "usr_2",
    name: "مریم احمدی",
    email: "maryam@example.com",
    phone: "09123334455",
    status: "active",
    registeredAt: "2026-02-01",
    goal: "چربی‌سوزی و رسیدن به اولین بارفیکس",
    calculatedLevel: "beginner"
  }
];

// Products Store
let productsCatalog: any[] = [
  {
    id: "prod_course_calisthenics_master",
    title_fa: "دوره جامع مسترکلاس کلیستنیکس و کنترل بدن",
    description_fa: "دوره ویدیویی پیشرفته شامل آموزش فرانت لور، هدف‌گذاری پرچمی، بالانس و تکنیک‌های پیشرفته قدرتی کلیستنیکس.",
    price_toman: 490000,
    is_free: false,
    image_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    features_fa: ["بیش از ۱۰ ساعت ویدیو HD", "برنامه تمرینی اختصاصی PDF", "پشتیبانی مستقیم تلگرام"],
    category: "course"
  },
  {
    id: "prod_ebook_nutrition_science",
    title_fa: "کتاب الکترونیکی علم رژیم و فیتنس بدون گرسنگی",
    description_fa: "راهنمای عملی محاسبه درشت‌مغذی‌ها، انتخاب مواد غذایی ایرانی، رژیم چربی‌سوزی ماندگار و مکمل‌شناسی.",
    price_toman: 190000,
    is_free: false,
    image_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80",
    features_fa: ["فرمت PDF تعاملی", "جدول ارزش غذایی غذاهای ایرانی", "محاسبه‌گر اکسل همراه"],
    category: "ebook"
  }
];

// YouTube Videos Store
let youtubeVideosStore: any[] = [
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

// Helper to extract YouTube Video ID from any YouTube URL
function extractYouTubeVideoId(urlOrId: string): string {
  if (!urlOrId) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrId.match(regExp);
  return (match && match[2].length === 11) ? match[2] : urlOrId.trim();
}

// Middleware: Verify Admin Authentication
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = (req.headers["x-admin-token"] as string) || 
    (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : "");

  if (!token || !activeSessions[token]) {
    return res.status(401).json({ error: "نشست مدیریتی نامعتبر یا منقضی شده است. لطفاً دوباره وارد شوید." });
  }

  const session = activeSessions[token];
  if (Date.now() > session.expiresAt) {
    delete activeSessions[token];
    return res.status(401).json({ error: "نشست شما به پایان رسیده است." });
  }

  (req as any).adminUser = session.username;
  next();
}

// ---------------------------------------------------------
// SERVER INITIALIZATION
// ---------------------------------------------------------

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(cookieParser());

  // Mount Authentication and Core Database / Sync Endpoints
  app.use("/api/v1/auth", authRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/v1", apiRouter);
  app.use("/api", apiRouter);

  // 1. PUBLIC HEALTH & CONFIG ENDPOINTS
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "FIT MAX | فیت مکس", timestamp: new Date().toISOString() });
  });

  app.get("/api/admin/config", (req, res) => {
    res.json({ adminAccessPath: ADMIN_ACCESS_PATH });
  });

  // 2. PUBLIC SITE SETTINGS & COMMENTS API
  app.get("/api/site-settings", (req, res) => {
    res.json({
      siteSettings,
      typographySettings,
      appearanceSettings,
      heroBanners: heroBanners.filter(b => b.is_active)
    });
  });

  app.get("/api/youtube", (req, res) => {
    res.json(youtubeVideosStore);
  });

  app.get("/api/comments", (req, res) => {
    const { article_id, status } = req.query;
    let filtered = [...pendingComments];
    if (article_id) filtered = filtered.filter(c => c.article_id === article_id);
    if (status) filtered = filtered.filter(c => c.status === status);
    else filtered = filtered.filter(c => c.status === "approved"); // Default public only approved
    res.json(filtered);
  });

  app.post("/api/comments", (req, res) => {
    const { article_id, user_name, content } = req.body;
    if (!article_id || !user_name || !content) {
      return res.status(400).json({ error: "اطلاعات کامنت ناقص است." });
    }

    const newComment = {
      id: `c_${Date.now()}`,
      article_id,
      user_name,
      content,
      created_at: new Date().toISOString(),
      status: "pending"
    };

    pendingComments.push(newComment);
    res.json({ message: "دیدگاه شما ثبت شد و پس از بررسی مدیر منتشر می‌شود.", comment: newComment });
  });

  // 3. AI COACH PUBLIC ENDPOINT
  app.post("/api/ai-coach", async (req, res) => {
    try {
      const { userQuestion, userProfile, conversationHistory } = req.body;

      if (!userQuestion) {
        return res.status(400).json({ error: "سوال کاربر الزامی است." });
      }

      const knowledgeContext = aiCoachKnowledge
        .filter(k => k.is_active)
        .map(k => `[${k.title_fa}]: ${k.content_fa}`)
        .join("\n");

      const systemInstruction = `
تو «مربی هوشمند فیت مکس (FIT MAX AI COACH)»، مربی رسمی پلتفرم آموزشی فیت مکس و کانال یوتیوب Fit Max هستید.

وظیفه و اصول تو:
۱. پاسخ کاملاً فارسی، روان، علمی، محترمانه، انگیزه بخش و صمیمی.
۲. پاسخگویی فقط به سوالات مربوط به فیتنس، کلیستنیکس، بدنسازی، تکنیک حرکات، آناتومی، بیومکانیک، برنامه‌ریزی تمرین، تغذیه ورزشی، محاسبه کالری و ریکاوری.
۳. راه ارتباطی با پشتیبانی مدیریت: ${siteSettings.telegramAdminHandle}.
۴. در صورتی که سوال غیرمرتبط است، محترمانه بگو: «من مربی هوشمند فیت مکس هستم و تخصصی در زمینه سوالات فیتنس، تمرین و تغذیه ورزشی پاسخ می‌دهم.»
۵. استناد به اصول علم تمرین (ACSM, NSCA) و دانش اختصاصی زیر:
${knowledgeContext}
۶. توصیه به تماشای ویدیوهای کانال یوتیوب Fit Max (${siteSettings.youtubeUrl}).
۷. خط قرمز پزشکی: به هیچ وجه بیماری یا آسیب‌دیدگی شدید حاد را تشخیص نده و در صورت گزارش درد شدید یا علائم خطرناک، کاربر را ارزیابی پزشک یا متخصص فیزیوتراپی ارجاع بده.

اطلاعات کاربر:
${userProfile ? JSON.stringify(userProfile) : "اطلاعات عمومی"}
      `;

      let promptText = `سوال کاربر: ${userQuestion}`;
      if (conversationHistory && Array.isArray(conversationHistory)) {
        const historyText = conversationHistory
          .map((msg: any) => `${msg.role === 'user' ? 'کاربر' : 'مربی'}: ${msg.content}`)
          .join('\n');
        promptText = `تاریخچه گفتگو:\n${historyText}\n\nسوال جدید کاربر: ${userQuestion}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "متأسفانه پاسخی دریافت نشد. لطفاً دوباره تلاش کنید.";
      return res.json({ reply });
    } catch (error: any) {
      console.error("AI Coach Error:", error);
      return res.status(500).json({
        reply: "در حال حاضر ارتباط با مربی هوشمند برقرار نشد. لطفاً دوباره تلاش کنید."
      });
    }
  });

  // ---------------------------------------------------------
  // 4. AUTHENTICATION & LOGIN API
  // ---------------------------------------------------------

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "نام کاربری و رمز عبور الزامی است." });
    }

    const inputHash = hashPassword(password);

    if (username.trim() === adminCredentials.username && inputHash === adminCredentials.passwordHash) {
      const token = crypto.randomBytes(32).toString("hex");
      activeSessions[token] = {
        username: adminCredentials.username,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 Hours
      };

      logAdminActivity(adminCredentials.username, "ورود به سیستم", "Admin Panel", "ورود موفقیت‌آمیز به پنل مدیریت");

      return res.json({
        success: true,
        token,
        username: adminCredentials.username,
        message: "ورود موفقیت‌آمیز بود."
      });
    } else {
      logAdminActivity(username, "تلاش ورود ناموفق", "Admin Panel", `نام کاربری وارد شده: ${username}`);
      return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
    }
  });

  app.get("/api/admin/verify", requireAdminAuth, (req, res) => {
    res.json({ valid: true, username: (req as any).adminUser });
  });

  app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
    const token = (req.headers["x-admin-token"] as string) || 
      (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : "");
    if (token) delete activeSessions[token];
    logAdminActivity((req as any).adminUser, "خروج از سیستم", "Admin Panel", "خروج کامل و ابطال نشست");
    res.json({ success: true, message: "با موفقیت خارج شدید." });
  });

  app.post("/api/admin/change-credentials", requireAdminAuth, (req, res) => {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({ error: "تمام فیلدها الزامی است." });
    }

    if (hashPassword(currentPassword) !== adminCredentials.passwordHash) {
      return res.status(400).json({ error: "رمز عبور فعلی نادرست است." });
    }

    adminCredentials.username = newUsername.trim();
    adminCredentials.passwordHash = hashPassword(newPassword);

    logAdminActivity((req as any).adminUser, "تغییر اطلاعات ورود", "Admin Credentials", `نام کاربری جدید: ${newUsername}`);

    res.json({ success: true, message: "اطلاعات ورود مدیریت با موفقیت بروزرسانی شد." });
  });

  // ---------------------------------------------------------
  // 5. PROTECTED ADMIN DASHBOARD & DOMAIN APIs
  // ---------------------------------------------------------

  // Dashboard Stats
  app.get("/api/admin/dashboard-stats", requireAdminAuth, (req, res) => {
    res.json({
      totalUsers: registeredUsers.length,
      newUsers: registeredUsers.filter(u => u.registeredAt >= "2026-02-01").length,
      totalPrograms: 8,
      activePrograms: 6,
      totalExercises: 35,
      totalArticles: 12,
      totalYoutubeVideos: youtubeVideosStore.length,
      pendingCommentsCount: pendingComments.filter(c => c.status === "pending").length,
      totalProducts: productsCatalog.length,
      recentActivityLogs: activityLogs.slice(0, 10)
    });
  });

  // Activity Logs API
  app.get("/api/admin/activity-logs", requireAdminAuth, (req, res) => {
    res.json(activityLogs);
  });

  // Site Settings API
  app.get("/api/admin/site-settings", requireAdminAuth, (req, res) => {
    res.json({ siteSettings, typographySettings, appearanceSettings });
  });

  app.post("/api/admin/site-settings", requireAdminAuth, (req, res) => {
    const { newSiteSettings, newTypography, newAppearance } = req.body;

    if (newSiteSettings) siteSettings = { ...siteSettings, ...newSiteSettings };
    if (newTypography) typographySettings = { ...typographySettings, ...newTypography };
    if (newAppearance) appearanceSettings = { ...appearanceSettings, ...newAppearance };

    logAdminActivity((req as any).adminUser, "بروزرسانی تنظیمات سایت", "Site Settings", "تغییر اطلاعات کلی، ظاهر یا فونت");

    res.json({ success: true, siteSettings, typographySettings, appearanceSettings });
  });

  // Banners API
  app.get("/api/admin/banners", requireAdminAuth, (req, res) => {
    res.json(heroBanners);
  });

  app.post("/api/admin/banners", requireAdminAuth, (req, res) => {
    const banner = req.body;
    if (!banner.id) {
      banner.id = `ban_${Date.now()}`;
      heroBanners.push(banner);
      logAdminActivity((req as any).adminUser, "ایجاد بنر جدید", banner.title_fa, `شناسه: ${banner.id}`);
    } else {
      const idx = heroBanners.findIndex(b => b.id === banner.id);
      if (idx !== -1) heroBanners[idx] = banner;
      else heroBanners.push(banner);
      logAdminActivity((req as any).adminUser, "ویرایش بنر", banner.title_fa, `شناسه: ${banner.id}`);
    }
    res.json({ success: true, heroBanners });
  });

  app.delete("/api/admin/banners/:id", requireAdminAuth, (req, res) => {
    heroBanners = heroBanners.filter(b => b.id !== req.params.id);
    logAdminActivity((req as any).adminUser, "حذف بنر", req.params.id, "بنر از سیستم حذف شد");
    res.json({ success: true, heroBanners });
  });

  // Media Manager API
  app.get("/api/admin/media", requireAdminAuth, (req, res) => {
    res.json(mediaFiles);
  });

  app.post("/api/admin/media", requireAdminAuth, (req, res) => {
    const { filename, folder, url, alt_text, size_kb } = req.body;
    if (!filename || !folder || !url) {
      return res.status(400).json({ error: "اطلاعات تصویر ناقص است." });
    }

    const newMedia = {
      id: `med_${Date.now()}`,
      filename,
      folder,
      url,
      alt_text: alt_text || filename,
      created_at: new Date().toISOString(),
      size_kb: size_kb || 150
    };

    mediaFiles.unshift(newMedia);
    logAdminActivity((req as any).adminUser, "آپلود و افزودن تصویر", filename, `پوشه: /images/${folder}`);

    res.json({ success: true, media: newMedia, mediaFiles });
  });

  app.delete("/api/admin/media/:id", requireAdminAuth, (req, res) => {
    mediaFiles = mediaFiles.filter(m => m.id !== req.params.id);
    logAdminActivity((req as any).adminUser, "حذف تصویر", req.params.id, "تصویر از گالری رسانه حذف شد");
    res.json({ success: true, mediaFiles });
  });

  // Pages Manager API
  app.get("/api/admin/pages", requireAdminAuth, (req, res) => {
    res.json(pagesContent);
  });

  app.post("/api/admin/pages", requireAdminAuth, (req, res) => {
    const { page_slug, pageData } = req.body;
    if (page_slug && pageData) {
      pagesContent[page_slug] = pageData;
      logAdminActivity((req as any).adminUser, "ویرایش محتوای صفحه", page_slug, `عنوان: ${pageData.page_title_fa}`);
    }
    res.json({ success: true, pagesContent });
  });

  // Comments Management API
  app.get("/api/admin/comments", requireAdminAuth, (req, res) => {
    res.json(pendingComments);
  });

  app.post("/api/admin/comments/status", requireAdminAuth, (req, res) => {
    const { comment_id, status } = req.body;
    const comment = pendingComments.find(c => c.id === comment_id);
    if (comment) {
      comment.status = status;
      logAdminActivity((req as any).adminUser, "تغییر وضعیت دیدگاه", comment_id, `وضعیت جدید: ${status}`);
      return res.json({ success: true, comment, comments: pendingComments });
    }
    res.status(404).json({ error: "دیدگاه یافت نشد." });
  });

  app.delete("/api/admin/comments/:id", requireAdminAuth, (req, res) => {
    pendingComments = pendingComments.filter(c => c.id !== req.params.id);
    logAdminActivity((req as any).adminUser, "حذف دیدگاه", req.params.id, "دیدگاه کاربر حذف شد");
    res.json({ success: true, comments: pendingComments });
  });

  // YouTube Manager API
  app.get("/api/admin/youtube", requireAdminAuth, (req, res) => {
    res.json(youtubeVideosStore);
  });

  app.post("/api/admin/youtube", requireAdminAuth, (req, res) => {
    const videoData = req.body;
    videoData.youtube_id = extractYouTubeVideoId(videoData.youtube_id || videoData.url || "");

    if (!videoData.id) {
      videoData.id = `yt_${Date.now()}`;
      youtubeVideosStore.unshift(videoData);
      logAdminActivity((req as any).adminUser, "افزودن ویدیوی یوتیوب", videoData.title_fa, `YouTube ID: ${videoData.youtube_id}`);
    } else {
      const idx = youtubeVideosStore.findIndex(v => v.id === videoData.id);
      if (idx !== -1) youtubeVideosStore[idx] = videoData;
      else youtubeVideosStore.unshift(videoData);
      logAdminActivity((req as any).adminUser, "ویرایش ویدیوی یوتیوب", videoData.title_fa, `شناسه: ${videoData.id}`);
    }

    res.json({ success: true, youtubeVideos: youtubeVideosStore });
  });

  app.delete("/api/admin/youtube/:id", requireAdminAuth, (req, res) => {
    youtubeVideosStore = youtubeVideosStore.filter(v => v.id !== req.params.id);
    logAdminActivity((req as any).adminUser, "حذف ویدیوی یوتیوب", req.params.id, "ویدیو حذف شد");
    res.json({ success: true, youtubeVideos: youtubeVideosStore });
  });

  // Products API
  app.get("/api/admin/products", requireAdminAuth, (req, res) => {
    res.json(productsCatalog);
  });

  app.post("/api/admin/products", requireAdminAuth, (req, res) => {
    const prod = req.body;
    if (!prod.id) {
      prod.id = `prod_${Date.now()}`;
      productsCatalog.push(prod);
      logAdminActivity((req as any).adminUser, "ایجاد محصول جدید", prod.title_fa, `قیمت: ${prod.price_toman} تومان`);
    } else {
      const idx = productsCatalog.findIndex(p => p.id === prod.id);
      if (idx !== -1) productsCatalog[idx] = prod;
      else productsCatalog.push(prod);
      logAdminActivity((req as any).adminUser, "ویرایش محصول", prod.title_fa, `قیمت: ${prod.price_toman} تومان`);
    }
    res.json({ success: true, products: productsCatalog });
  });

  app.delete("/api/admin/products/:id", requireAdminAuth, (req, res) => {
    productsCatalog = productsCatalog.filter(p => p.id !== req.params.id);
    logAdminActivity((req as any).adminUser, "حذف محصول", req.params.id, "محصول از فروشگاه حذف شد");
    res.json({ success: true, products: productsCatalog });
  });

  // AI Coach Knowledge API
  app.get("/api/admin/ai-coach-knowledge", requireAdminAuth, (req, res) => {
    res.json(aiCoachKnowledge);
  });

  app.post("/api/admin/ai-coach-knowledge", requireAdminAuth, (req, res) => {
    const item = req.body;
    if (!item.id) {
      item.id = `ak_${Date.now()}`;
      aiCoachKnowledge.push(item);
      logAdminActivity((req as any).adminUser, "افزودن منبع دانش AI", item.title_fa, `دسته: ${item.category}`);
    } else {
      const idx = aiCoachKnowledge.findIndex(k => k.id === item.id);
      if (idx !== -1) aiCoachKnowledge[idx] = item;
      else aiCoachKnowledge.push(item);
      logAdminActivity((req as any).adminUser, "ویرایش دانش AI", item.title_fa, `شناسه: ${item.id}`);
    }
    res.json({ success: true, aiCoachKnowledge });
  });

  app.delete("/api/admin/ai-coach-knowledge/:id", requireAdminAuth, (req, res) => {
    aiCoachKnowledge = aiCoachKnowledge.filter(k => k.id !== req.params.id);
    logAdminActivity((req as any).adminUser, "حذف منبع دانش AI", req.params.id, "منبع آموزشی AI حذف گردید");
    res.json({ success: true, aiCoachKnowledge });
  });

  // Users Management API
  app.get("/api/admin/users", requireAdminAuth, (req, res) => {
    res.json(registeredUsers);
  });

  app.post("/api/admin/users/status", requireAdminAuth, (req, res) => {
    const { user_id, status } = req.body;
    const usr = registeredUsers.find(u => u.id === user_id);
    if (usr) {
      usr.status = status;
      logAdminActivity((req as any).adminUser, "تغییر وضعیت کاربر", user_id, `وضعیت جدید: ${status}`);
      return res.json({ success: true, users: registeredUsers });
    }
    res.status(404).json({ error: "کاربر یافت نشد." });
  });

  // Export Data Backup API
  app.get("/api/admin/export", requireAdminAuth, (req, res) => {
    const fullBackup = {
      siteSettings,
      typographySettings,
      appearanceSettings,
      heroBanners,
      pagesContent,
      pendingComments,
      mediaFiles,
      aiCoachKnowledge,
      productsCatalog,
      youtubeVideosStore,
      registeredUsers,
      activityLogs,
      exportedAt: new Date().toISOString()
    };
    logAdminActivity((req as any).adminUser, "دانلود بک‌آپ کامل", "Database Backup", "خروجی JSON گرفته شد");
    res.setHeader("Content-Disposition", "attachment; filename=fitmax_backup.json");
    res.json(fullBackup);
  });

  // ---------------------------------------------------------
  // 6. VITE MIDDLEWARE FOR DEV / STATIC FOR PROD
  // ---------------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fit Max Server running on http://localhost:${PORT}`);
    console.log(`Admin Secret Path configured at: http://localhost:${PORT}${ADMIN_ACCESS_PATH}`);
  });
}

startServer();
