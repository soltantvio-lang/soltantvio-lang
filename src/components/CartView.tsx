import React from 'react';
import { ShoppingCart, Send, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { FitMaxMascot } from './FitMaxMascot';

export const CartView: React.FC = () => {
  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-8 pb-12 animate-fadeIn">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl space-y-3 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold">
          <ShoppingCart className="w-4 h-4" />
          <span>سبد سفارش خدمات و محصولات فیت مکس</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">سبد خرید و خدمات مشاوره</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-6 text-center">
        <FitMaxMascot pose="welcome" size="lg" />
        
        <div className="space-y-2 max-w-xl mx-auto">
          <div className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-xs px-4 py-1.5 rounded-full mb-2">
            تمامی برنامه‌های تمرینی فیت مکس کاملاً رایگان هستند!
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">مشاوره مستقیم با پشتیبانی فیت مکس</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            جهت دریافت مشاوره اختصاصی، سوالات درباره دوره‌ها یا ارتباط با ادمین، از طریق شناسه تلگرام زیر پیام دهید:
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <a
            href="https://t.me/FitMax_Admin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-8 py-4 rounded-2xl text-sm shadow-md transition"
          >
            <Send className="w-5 h-5" />
            <span>ارتباط با پشتیبانی تلگرام (@FitMax_Admin)</span>
            <ArrowLeft className="w-4 h-4" />
          </a>
        </div>
      </div>

    </div>
  );
};
