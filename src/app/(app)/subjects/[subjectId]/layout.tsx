"use client";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Timer, BookMarked, Video, RotateCcw, FileText, CheckSquare, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject { id: string; name: string; nameAr?: string; color: string; icon: string; }

export default function SubjectLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const pathname = usePathname();
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    fetch(`/api/subjects/${subjectId}`).then(r => r.json()).then(setSubject);
  }, [subjectId]);

  const tabs = [
    { href: `/subjects/${subjectId}`, label: t("overview"), icon: LayoutDashboard, exact: true },
    { href: `/subjects/${subjectId}/schedule`, label: t("schedule"), icon: Calendar },
    { href: `/subjects/${subjectId}/pomodoro`, label: t("pomodoro"), icon: Timer },
    { href: `/subjects/${subjectId}/chapters`, label: t("chapters"), icon: BookMarked },
    { href: `/subjects/${subjectId}/lectures`, label: t("lectures"), icon: Video },
    { href: `/subjects/${subjectId}/reviews`, label: t("reviews"), icon: RotateCcw },
    { href: `/subjects/${subjectId}/exams`, label: t("exams"), icon: FileText },
    { href: `/subjects/${subjectId}/tasks`, label: t("tasks"), icon: CheckSquare },
  ];

  return (
    <div>
      {/* Subject header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/subjects" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        {subject ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: subject.color + "20" }}>
              {subject.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{subject.name}</h1>
              {subject.nameAr && <p className="text-xs text-gray-400" dir="rtl">{subject.nameAr}</p>}
            </div>
          </div>
        ) : (
          <div className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
              )}>
              <Icon size={13} />
              {label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
