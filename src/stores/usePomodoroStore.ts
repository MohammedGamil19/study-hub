import { create } from "zustand";
import { persist } from "zustand/middleware";

type Phase = "study" | "short-break" | "long-break";

interface PomodoroStore {
  subjectId: string | null;
  phase: Phase;
  timeLeft: number;
  isRunning: boolean;
  sessionCount: number;
  studyMins: number;
  breakMins: number;
  longBreakMins: number;
  sessionsBeforeLong: number;
  totalStudiedToday: number;
  setSubject: (id: string) => void;
  setRunning: (v: boolean) => void;
  setTimeLeft: (t: number) => void;
  nextPhase: () => void;
  reset: () => void;
  addStudiedMins: (mins: number) => void;
  setSettings: (s: Partial<Pick<PomodoroStore, "studyMins" | "breakMins" | "longBreakMins" | "sessionsBeforeLong">>) => void;
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      subjectId: null,
      phase: "study",
      timeLeft: 25 * 60,
      isRunning: false,
      sessionCount: 0,
      studyMins: 25,
      breakMins: 5,
      longBreakMins: 15,
      sessionsBeforeLong: 4,
      totalStudiedToday: 0,
      setSubject: (id) => {
        const s = get();
        if (id !== s.subjectId) {
          set({ subjectId: id, phase: "study", timeLeft: s.studyMins * 60, isRunning: false, sessionCount: 0 });
        }
      },
      setRunning: (v) => set({ isRunning: v }),
      setTimeLeft: (t) => set({ timeLeft: t }),
      nextPhase: () => {
        const { phase, sessionCount, studyMins, breakMins, longBreakMins, sessionsBeforeLong } = get();
        if (phase === "study") {
          const newCount = sessionCount + 1;
          const nextPhase = newCount % sessionsBeforeLong === 0 ? "long-break" : "short-break";
          set({ phase: nextPhase, sessionCount: newCount, timeLeft: nextPhase === "long-break" ? longBreakMins * 60 : breakMins * 60, isRunning: false });
        } else {
          set({ phase: "study", timeLeft: studyMins * 60, isRunning: false });
        }
      },
      reset: () => {
        const { studyMins } = get();
        set({ phase: "study", timeLeft: studyMins * 60, isRunning: false, sessionCount: 0 });
      },
      addStudiedMins: (mins) => set((s) => ({ totalStudiedToday: s.totalStudiedToday + mins })),
      setSettings: (s) => {
        set(s);
        const { studyMins } = { ...get(), ...s };
        set({ timeLeft: studyMins * 60, isRunning: false, phase: "study" });
      },
    }),
    { name: "pomodoro-store" }
  )
);
