"use client";
import { useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Play, Pause, RotateCcw, SkipForward, Settings2 } from "lucide-react";
import { usePomodoroStore } from "@/stores/usePomodoroStore";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PHASE_COLORS = { "study": "#6366f1", "short-break": "#10b981", "long-break": "#14b8a6" };
const PHASE_BG = { "study": "bg-indigo-50", "short-break": "bg-green-50", "long-break": "bg-teal-50" };

export default function PomodoroPage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const store = usePomodoroStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ studyMins: store.studyMins, breakMins: store.breakMins, longBreakMins: store.longBreakMins, sessionsBeforeLong: store.sessionsBeforeLong });
  const [todayMins, setTodayMins] = useState(0);

  useEffect(() => {
    store.setSubject(subjectId);
    fetch(`/api/pomodoro?subjectId=${subjectId}`).then(r => r.json()).then(d => setTodayMins(d.totalMins || 0));
  }, [subjectId]);

  const saveSession = useCallback(async (durationMins: number) => {
    if (durationMins < 1) return;
    const end = new Date();
    const start = sessionStartRef.current || new Date(end.getTime() - durationMins * 60000);
    await fetch("/api/pomodoro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, durationMins, type: "STUDY", startedAt: start.toISOString(), endedAt: end.toISOString() }),
    });
    setTodayMins((m) => m + durationMins);
    store.addStudiedMins(durationMins);
  }, [subjectId, store]);

  const tick = useCallback(() => {
    store.setTimeLeft(store.timeLeft - 1);
    if (store.timeLeft - 1 <= 0) {
      if (store.phase === "study") {
        const elapsed = store.studyMins - Math.round((store.timeLeft - 1) / 60);
        saveSession(Math.max(store.studyMins, 1));
        playSound();
      }
      store.nextPhase();
      sessionStartRef.current = new Date();
    }
  }, [store, saveSession]);

  useEffect(() => {
    if (store.isRunning) {
      if (!sessionStartRef.current) sessionStartRef.current = new Date();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [store.isRunning, tick]);

  const handleStart = () => {
    if (!store.isRunning) sessionStartRef.current = new Date();
    store.setRunning(!store.isRunning);
  };

  const handleReset = async () => {
    if (store.isRunning && store.phase === "study") {
      const elapsed = Math.round((store.studyMins * 60 - store.timeLeft) / 60);
      if (elapsed > 0) await saveSession(elapsed);
    }
    store.reset();
    sessionStartRef.current = null;
  };

  const handleSkip = async () => {
    if (store.phase === "study") {
      const elapsed = Math.round((store.studyMins * 60 - store.timeLeft) / 60);
      if (elapsed > 0) await saveSession(elapsed);
    }
    store.nextPhase();
    sessionStartRef.current = new Date();
  };

  const saveSettings = () => {
    store.setSettings(settingsForm);
    setShowSettings(false);
  };

  const total = store.phase === "study" ? store.studyMins * 60 : store.phase === "short-break" ? store.breakMins * 60 : store.longBreakMins * 60;
  const pct = ((total - store.timeLeft) / total) * 100;
  const mins = Math.floor(store.timeLeft / 60).toString().padStart(2, "0");
  const secs = (store.timeLeft % 60).toString().padStart(2, "0");
  const color = PHASE_COLORS[store.phase];

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="max-w-sm mx-auto">
      {/* Phase indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {(["study", "short-break", "long-break"] as const).map((ph) => (
          <span key={ph} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all", store.phase === ph ? "text-white" : "bg-gray-100 text-gray-400")}
            style={store.phase === ph ? { backgroundColor: PHASE_COLORS[ph] } : {}}>
            {ph === "study" ? t("studyTime") : ph === "short-break" ? t("breakTime") : t("longBreak")}
          </span>
        ))}
      </div>

      {/* Timer ring */}
      <div className={cn("relative flex items-center justify-center rounded-3xl p-8 mb-6 transition-colors", PHASE_BG[store.phase])}>
        <svg width="220" height="220" className="timer-ring">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="110" cy="110" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="absolute text-center">
          <div className="text-5xl font-bold tabular-nums" style={{ color }}>{mins}:{secs}</div>
          <div className="text-sm text-gray-400 mt-1">{t("session")} #{store.sessionCount + 1}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button onClick={handleReset} className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
          <RotateCcw size={20} />
        </button>
        <button onClick={handleStart} className="px-10 py-3 rounded-2xl text-white font-semibold text-lg transition-all active:scale-95"
          style={{ backgroundColor: color }}>
          {store.isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button onClick={handleSkip} className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
          <SkipForward size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{Math.floor(todayMins / 60)}h {todayMins % 60}m</p>
          <p className="text-xs text-gray-400 mt-1">{t("totalStudied")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{store.sessionCount}</p>
          <p className="text-xs text-gray-400 mt-1">{t("pomodoro")} sessions</p>
        </div>
      </div>

      {/* Settings */}
      <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50">
        <Settings2 size={15} /> {t("pomodoroSettings")}
      </button>

      {showSettings && (
        <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {[
            { key: "studyMins", label: t("studyDuration") },
            { key: "breakMins", label: t("breakDuration") },
            { key: "longBreakMins", label: t("longBreakDuration") },
            { key: "sessionsBeforeLong", label: t("sessionsBeforeLongBreak") },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-gray-600">{label}</label>
              <input type="number" min="1" max="120"
                value={settingsForm[key as keyof typeof settingsForm]}
                onChange={(e) => setSettingsForm({ ...settingsForm, [key]: Number(e.target.value) })}
                className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <button onClick={saveSettings} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">{t("save")}</button>
        </div>
      )}
    </div>
  );
}

function playSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}
