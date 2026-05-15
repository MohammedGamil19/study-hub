"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Flame, Star, Trophy, Clock, CheckSquare, FileText, TrendingUp } from "lucide-react";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { getCached, setCached } from "@/lib/clientCache";

interface DashboardData {
  streak: { currentStreak: number; longestStreak: number; totalPoints: number } | null;
  recentPoints: { id: string; points: number; reason: string }[];
  subjects: { id: string; name: string; color: string; icon: string }[];
  todayTasks: { id: string; title: string; subjectId: string; subjectName: string; subjectColor: string }[];
  upcomingExams: { id: string; title: string; scheduledAt: string; subjectName: string }[];
  totalStudyMins: number;
}

const CACHE_KEY = "dashboard";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(() => getCached<DashboardData>(CACHE_KEY));

  useEffect(() => {
    // Serve cached data instantly, then refresh in the background
    const cached = getCached<DashboardData>(CACHE_KEY);
    if (cached) setData(cached);

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((fresh: DashboardData) => {
        setCached(CACHE_KEY, fresh);
        setData(fresh);
      });
  }, []);

  const streak = data?.streak;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("welcome")}, {session?.user?.name?.split(" ")[0] || t("student")} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), "EEEE, MMMM d yyyy")}</p>
      </div>

      {/* Streak & Points */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className="flame-anim" />
            <span className="text-sm font-medium opacity-90">{t("streak")}</span>
          </div>
          <p className="text-3xl font-bold">{streak?.currentStreak ?? 0}</p>
          <p className="text-xs opacity-75 mt-1">{t("days")}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Star size={20} />
            <span className="text-sm font-medium opacity-90">{t("points")}</span>
          </div>
          <p className="text-3xl font-bold">{streak?.totalPoints ?? 0}</p>
          <p className="text-xs opacity-75 mt-1">{t("totalEarned")}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} />
            <span className="text-sm font-medium opacity-90">{t("today")}</span>
          </div>
          <p className="text-3xl font-bold">
            {Math.floor((data?.totalStudyMins ?? 0) / 60)}h {(data?.totalStudyMins ?? 0) % 60}m
          </p>
          <p className="text-xs opacity-75 mt-1">{t("studyHours")}</p>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} />
            <span className="text-sm font-medium opacity-90">{t("longestStreak")}</span>
          </div>
          <p className="text-3xl font-bold">{streak?.longestStreak ?? 0}</p>
          <p className="text-xs opacity-75 mt-1">{t("days")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare size={18} className="text-indigo-500" /> {t("todayTasks")}
            </h2>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
              {data?.todayTasks.length ?? 0}
            </span>
          </div>
          {!data ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : data.todayTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">{t("noDueToday")}</div>
          ) : (
            <div className="space-y-2">
              {data.todayTasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={`/subjects/${task.subjectId}/tasks`}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.subjectColor }} />
                  <span className="text-sm text-gray-700 flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-gray-400">{task.subjectName}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={18} className="text-red-500" /> {t("upcomingExams")}
            </h2>
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {data?.upcomingExams.length ?? 0}
            </span>
          </div>
          {!data ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : data.upcomingExams.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">{t("noUpcomingExams")}</div>
          ) : (
            <div className="space-y-2">
              {data.upcomingExams.map((exam) => {
                const days = differenceInDays(new Date(exam.scheduledAt), new Date());
                const urgency =
                  days <= 1
                    ? "text-red-600 bg-red-50"
                    : days <= 3
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-500 bg-gray-50";
                return (
                  <div key={exam.id} className="flex items-center gap-3 p-2 rounded-lg">
                    <FileText size={16} className="text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{exam.title}</p>
                      <p className="text-xs text-gray-400">
                        {exam.subjectName} · {format(new Date(exam.scheduledAt), "MMM d")}
                      </p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", urgency)}>
                      {days === 0 || isToday(new Date(exam.scheduledAt))
                        ? t("todayExcl")
                        : isTomorrow(new Date(exam.scheduledAt))
                        ? t("tomorrow")
                        : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick subject access */}
      {data && data.subjects.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-indigo-500" /> {t("yourSubjects")}
          </h2>
          <div className="flex gap-3 flex-wrap">
            {data.subjects.map((s) => (
              <Link
                key={s.id}
                href={`/subjects/${s.id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all text-sm font-medium text-gray-700"
              >
                <span>{s.icon}</span> {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent points */}
      {data && data.recentPoints.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t("recentActivity")}</h2>
          <div className="space-y-2">
            {data.recentPoints.map((pt) => (
              <div key={pt.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{pt.reason.replace("_", " ").toLowerCase()}</span>
                <span className="text-sm font-medium text-amber-600">+{pt.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
