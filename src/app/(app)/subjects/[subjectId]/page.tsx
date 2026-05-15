"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Calendar, Timer, BookMarked, Video, RotateCcw, FileText, CheckSquare, ChevronRight } from "lucide-react";
import { getCached, setCached } from "@/lib/clientCache";

interface Stats {
  chapters: number;
  completedChapters: number;
  tasks: number;
  completedTasks: number;
  lectures: number;
  reviews: number;
  exams: number;
  studyMins: number;
}

export default function SubjectOverviewPage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const cacheKey = `subject-stats:${subjectId}`;
  const [stats, setStats] = useState<Stats | null>(() => getCached<Stats>(cacheKey));

  useEffect(() => {
    const cached = getCached<Stats>(cacheKey);
    if (cached) setStats(cached);
    fetch(`/api/subjects/${subjectId}/stats`)
      .then((r) => r.json())
      .then((data) => { setCached(cacheKey, data); setStats(data); });
  }, [subjectId]);

  const quickLinks = [
    { href: `/subjects/${subjectId}/schedule`, icon: Calendar, label: t("schedule"), color: "bg-blue-50 text-blue-600" },
    { href: `/subjects/${subjectId}/pomodoro`, icon: Timer, label: t("pomodoro"), color: "bg-purple-50 text-purple-600" },
    { href: `/subjects/${subjectId}/chapters`, icon: BookMarked, label: t("chapters"), color: "bg-green-50 text-green-600" },
    { href: `/subjects/${subjectId}/lectures`, icon: Video, label: t("lectures"), color: "bg-orange-50 text-orange-600" },
    { href: `/subjects/${subjectId}/reviews`, icon: RotateCcw, label: t("reviews"), color: "bg-cyan-50 text-cyan-600" },
    { href: `/subjects/${subjectId}/exams`, icon: FileText, label: t("exams"), color: "bg-red-50 text-red-600" },
    { href: `/subjects/${subjectId}/tasks`, icon: CheckSquare, label: t("tasks"), color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t("chapters")} value={`${stats.completedChapters}/${stats.chapters}`} sub={t("completed")} color="text-green-600" />
          <StatCard label={t("tasks")} value={`${stats.completedTasks}/${stats.tasks}`} sub={t("completed")} color="text-indigo-600" />
          <StatCard label={t("studyHours")} value={`${Math.floor(stats.studyMins / 60)}h ${stats.studyMins % 60}m`} sub={t("today")} color="text-purple-600" />
          <StatCard label={t("upcomingExams")} value={stats.exams} sub={t("exams")} color="text-red-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
              <div className="h-6 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("overview")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {stats && stats.chapters > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t("progress")}</span>
            <span className="text-sm font-bold text-indigo-600">
              {Math.round((stats.completedChapters / stats.chapters) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((stats.completedChapters / stats.chapters) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {stats.completedChapters} of {stats.chapters} {t("chapters")} {t("completed")}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: any; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
