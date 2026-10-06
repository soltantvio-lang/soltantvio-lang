import React, { useState, useRef, useEffect } from 'react';
import { UserAssessment, FitnessProfile } from '../types';
import { FitMaxMascot } from './FitMaxMascot';
import { Brain, Send, Sparkles, User, ShieldCheck, RefreshCw } from 'lucide-react';

interface AICoachViewProps {
  assessment: UserAssessment | null;
  profile: FitnessProfile | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export const AICoachView: React.FC<AICoachViewProps> = ({ assessment, profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'coach',
      text: 'درود! من مربی هوشمند فیت مکس (FIT MAX AI Coach) هستم. تمام سوالات علمی شما درباره کلیستنیکس، تکنیک حرکات، اصلاح فرم، جایگزینی تمرین و برنامه‌ریزی تغذیه را بر اساس شواهد معتبر پاسخ می‌دهم. چه سوالی داری؟',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    'چگونه رکورد بارفیکس خودم را از ۳ به ۱۰ تکرار برسانم؟',
    'بهترین روش جایگزینی شنا سوئدی برای جلوگیری از فشار مچ دست چیست؟',
    'برای افزایش حجم تمیز عضلانی چند گرم پروتئین در روز نیاز دارم؟',
    'چگونه حرکت دیپس (Parallel Dips) را بدون آسیب به شانه انجام دهم؟'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendQuestion = async (textToSend?: string) => {
    const q = textToSend || inputQuestion;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuestion: q,
          userProfile: {
            level: profile?.level || assessment?.calculatedLevel || 'beginner',
            goal: profile?.primaryGoal || assessment?.primaryGoal || 'muscle_gain',
            pushups: assessment?.pushupsMax,
            pullups: assessment?.pullupsMax,
            environment: assessment?.environment
          },
          conversationHistory: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
          }))
        })
      });

      const data = await response.json();

      const coachMsg: ChatMessage = {
        id: `c_${Date.now()}`,
        sender: 'coach',
        text: data.reply || 'پاسخی دریافت نشد.',
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, coachMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'coach',
          text: 'متأسفانه در برقراری ارتباط با مربی هوشمند مشکلی پیش آمد. لطفاً مجدداً امتحان کنید.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      
      {/* HEADER */}
      <div className="bg-orange-600 text-white p-6 sm:p-8 rounded-3xl flex items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500 rounded-full opacity-50 blur-2xl"></div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-orange-200 text-xs font-bold">
            <Brain className="w-5 h-5 text-white" />
            <span>مربی هوشمند اختصاصی فیت مکس</span>
          </div>
          <h1 className="text-2xl font-black">گفتگو با مربی هوشمند (FIT MAX AI COACH)</h1>
          <p className="text-xs text-orange-100">تحلیل علمی بر اساس پرونده ورزشی شما</p>
        </div>

        <div className="relative z-10">
          <FitMaxMascot pose="thinking" size="sm" />
        </div>
      </div>

      {/* QUICK QUESTION PILLS */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 block">سوالات پیشنهادی متداول:</span>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((qq, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(qq)}
              disabled={isLoading}
              className="bg-[#ffead9]/40 hover:bg-[#ffead9] border border-[#ffead9] text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition text-right shadow-2xs"
            >
              {qq}
            </button>
          ))}
        </div>
      </div>

      {/* CHAT MESSAGES WINDOW */}
      <div className="bg-white rounded-3xl border border-orange-100 p-6 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
              msg.sender === 'user' ? 'bg-slate-800' : 'bg-orange-600 shadow-xs'
            }`}>
              {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
              msg.sender === 'user'
                ? 'bg-slate-900 text-white rounded-tr-none'
                : 'bg-orange-50/90 text-slate-900 border border-orange-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-line font-medium">{msg.text}</div>
              <span className={`text-[10px] block text-left pt-1 ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center animate-pulse">
              <Brain className="w-5 h-5" />
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-xs text-orange-900 font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
              <span>مربی هوشمند در حال تحلیل سوال شماست...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT FORM */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="سوال خود درباره تمرین، تغذیه یا تکنیک حرکات را بنویسید..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
          className="flex-1 px-5 py-4 bg-white rounded-2xl border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-hidden shadow-xs"
        />
        <button
          onClick={() => handleSendQuestion()}
          disabled={isLoading || !inputQuestion.trim()}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white px-6 py-4 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0"
        >
          <span>ارسال</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center pt-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>پاسخ‌های مربی AI صرفاً جنبه آموزشی بر اساس علوم ورزشی داشته و جایگزین تشخیص پزشکی نیست.</span>
      </div>

    </div>
  );
};
