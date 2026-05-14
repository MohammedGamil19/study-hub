"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  BookOpen, Timer, Flame, Calendar, Sparkles, BarChart2,
  CheckCircle2, Crown, Globe, ArrowRight, Star, Zap,
  GraduationCap, Brain, Target, ChevronRight,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: BookOpen, color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50",
    title: "Subject Management", titleAr: "إدارة المواد",
    desc: "Organize chapters, lectures, schedules, exams, and tasks per subject — everything in one place.",
  },
  {
    icon: Timer, color: "from-purple-500 to-purple-600", bg: "bg-purple-50",
    title: "Pomodoro Timer", titleAr: "مؤقت بومودورو",
    desc: "25-minute focus sessions with automatic short and long breaks. Study time is logged automatically.",
  },
  {
    icon: Flame, color: "from-orange-500 to-red-500", bg: "bg-orange-50",
    title: "Streak & Points", titleAr: "السلسلة والنقاط",
    desc: "Earn points for every completed task, chapter, and review. Build daily streaks with up to ×5 multiplier.",
  },
  {
    icon: Calendar, color: "from-blue-500 to-cyan-500", bg: "bg-blue-50",
    title: "Smart Scheduling", titleAr: "الجدول الذكي",
    desc: "Set weekly study blocks and lecture timetables with 15-minute push notifications before each session.",
  },
  {
    icon: Sparkles, color: "from-pink-500 to-rose-500", bg: "bg-pink-50",
    title: "AI Lecture Summarizer", titleAr: "ملخص المحاضرات بالذكاء الاصطناعي",
    desc: "Upload photos of your lecture slides. AI instantly generates a detailed summary, flashcards, and exam questions.",
  },
  {
    icon: BarChart2, color: "from-green-500 to-emerald-500", bg: "bg-green-50",
    title: "Advanced Analytics", titleAr: "الإحصائيات المتقدمة",
    desc: "Track your study hours and task completion over any date range. See which subjects get the most attention.",
  },
];

const STEPS = [
  {
    step: "01", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100",
    title: "Create Your Subjects",
    desc: "Add your subjects with custom colors and icons. Set up chapter lists, lecture schedules, and exam dates.",
  },
  {
    step: "02", icon: Target, color: "text-purple-600", bg: "bg-purple-100",
    title: "Track Your Progress",
    desc: "Mark chapters complete, finish tasks, complete review sessions. Every action earns you points.",
  },
  {
    step: "03", icon: Flame, color: "text-orange-600", bg: "bg-orange-100",
    title: "Stay Consistent & Motivated",
    desc: "Build daily streaks, climb the points ladder, and use the Pomodoro timer to stay focused.",
  },
];

const FREE_FEATURES = [
  "Up to 3 subjects",
  "Pomodoro timer",
  "Chapter progress tracking",
  "Task management",
  "Weekly schedule",
  "Streak & points system",
  "Push notifications",
];

const PREMIUM_FEATURES = [
  "Unlimited subjects",
  "AI lecture summarizer",
  "Advanced analytics dashboard",
  "Focus mode (suppress distractions)",
  "No ads — ever",
  "Everything in Free",
];

const STATS = [
  { value: "25 min", label: "Focused study sessions", icon: Timer },
  { value: "6+", label: "Tools per subject", icon: BookOpen },
  { value: "2", label: "Languages supported", icon: Globe },
  { value: "×5", label: "Max streak multiplier", icon: Flame },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">StudyHub</span>
            <span className="text-sm text-gray-400 font-medium hidden sm:block">· ستاديهاب</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">
                Go to Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/register"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium mb-8">
            <Sparkles size={14} className="text-yellow-400" />
            <span>AI-Powered Study Companion</span>
            <span className="text-white/50">·</span>
            <span className="font-arabic text-white/80">رفيقك الذكي في المذاكرة</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Study Smarter,
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>

          <p className="text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto mb-4">
            The all-in-one academic planner that combines subject tracking, Pomodoro timer,
            streak rewards, and AI-powered lecture summaries — in English and Arabic.
          </p>

          <p className="text-base text-indigo-300/80 mb-10" dir="rtl">
            نظّم موادك، تابع تقدمك، واحصل على ملخصات فورية بالذكاء الاصطناعي 🚀
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                Open Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <>
                <Link href="/register"
                  className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                  Start for Free <ArrowRight size={20} />
                </Link>
                <Link href="/login"
                  className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-2xl font-semibold text-lg transition-all">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Hero Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <Icon size={20} className="text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-indigo-300 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-semibold text-indigo-600 mb-4">
              <Zap size={14} /> Everything You Need
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">
              One app. Every study tool.
            </h2>
            <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">
              No more switching between apps. StudyHub brings together everything a serious student needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, bg, title, titleAr, desc }) => (
              <div key={title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon size={16} className="text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-0.5">{title}</h3>
                <p className="text-xs text-gray-400 mb-3 font-medium" dir="rtl">{titleAr}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-sm font-semibold text-purple-600 mb-4">
              <Brain size={14} /> How It Works
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">Get started in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-orange-200" />

            {STEPS.map(({ step, icon: Icon, color, bg, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className={`w-20 h-20 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10`}>
                  <Icon size={32} className={color} />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-xs font-extrabold text-gray-500 shadow-sm">
                    {step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Feature Spotlight ── */}
      <section className="py-24 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-100 border border-pink-200 rounded-full text-sm font-semibold text-pink-700 mb-6">
                <Sparkles size={14} /> Premium Feature
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                Upload a photo.
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Get instant flashcards.
                </span>
              </h2>
              <p className="text-gray-500 text-lg mb-6 leading-relaxed">
                Take a photo of any lecture slide or handwritten notes. Our AI reads it and instantly produces
                a full summary, 5–10 flashcards, and exam-style questions — ready to study from.
              </p>
              <ul className="space-y-3">
                {["Detailed markdown summary (3–5 paragraphs)", "5–10 flip flashcards per upload", "3–7 exam-style practice questions", "Works with any subject or language"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={17} className="text-purple-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual mock */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <span className="font-bold text-gray-800">AI Lecture Summarizer</span>
              </div>

              <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center bg-purple-50">
                <div className="text-3xl mb-2">📸</div>
                <p className="text-sm text-purple-600 font-medium">Lecture slide uploaded</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Summary</p>
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                  <div className="h-2.5 bg-gray-200 rounded-full w-4/5" />
                  <div className="h-2.5 bg-gray-200 rounded-full w-5/6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-indigo-500 mb-1">🃏 FLASHCARD</p>
                  <p className="text-xs text-indigo-800 font-medium">What is the main concept?</p>
                </div>
                <div className="bg-green-50 border-2 border-green-100 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-green-500 mb-1">❓ QUESTION</p>
                  <p className="text-xs text-green-800 font-medium">Explain the key formula.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Arabic / Bilingual Section ── */}
      <section className="py-20 bg-gradient-to-br from-indigo-950 to-purple-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-5xl mb-6">🇸🇦 🇺🇸</div>
          <h2 className="text-4xl font-extrabold mb-4">بالعربي كمان ✨</h2>
          <p className="text-indigo-200 text-lg mb-3" dir="rtl">
            ستاديهاب مدعوم بالكامل باللغة العربية مع تخطيط من اليمين لليسار (RTL)
          </p>
          <p className="text-indigo-300">
            Full right-to-left Arabic layout — switch languages instantly from the settings page.
            Every feature, every label, every notification — in both languages.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-semibold text-amber-700 mb-4">
              <Crown size={14} /> Pricing
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">Simple, honest pricing</h2>
            <p className="text-gray-500 mt-2">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="rounded-2xl border-2 border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Free</h3>
              <p className="text-4xl font-extrabold text-gray-900 mt-3 mb-6">
                $0 <span className="text-base font-medium text-gray-400">/ forever</span>
              </p>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={17} className="text-gray-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="block w-full py-3 border-2 border-gray-300 hover:border-indigo-400 text-gray-700 hover:text-indigo-600 rounded-xl font-semibold text-center transition-all">
                Get Started Free
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50 to-white p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Crown size={20} className="text-amber-500" />
                <h3 className="text-xl font-bold text-gray-900">Premium</h3>
              </div>
              <p className="text-4xl font-extrabold text-indigo-700 mt-3 mb-6">
                Demo <span className="text-base font-medium text-gray-400">— activate free</span>
              </p>
              <ul className="space-y-3 mb-8">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 size={17} className="text-indigo-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-center transition-all shadow-lg shadow-indigo-200">
                Start & Upgrade
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-6xl mb-6">🎓</div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-indigo-100 text-lg mb-10">
            Join students who use StudyHub to stay organized, motivated, and consistent.
            It's free to start — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="flex items-center gap-2 px-10 py-4 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl font-bold text-lg transition-all shadow-xl">
                Open Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <>
                <Link href="/register"
                  className="flex items-center gap-2 px-10 py-4 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl font-bold text-lg transition-all shadow-xl">
                  Create Free Account <ArrowRight size={20} />
                </Link>
                <Link href="/login"
                  className="flex items-center gap-2 px-10 py-4 bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl font-semibold text-lg transition-all">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap size={17} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">StudyHub</span>
              <span className="text-gray-600">· ستاديهاب</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            </div>

            <p className="text-sm text-gray-600 flex items-center gap-1">
              Built with <Star size={13} className="text-yellow-500" /> for students
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
