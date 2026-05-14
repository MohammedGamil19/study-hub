"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { Plus, BookOpen, Crown, Trash2, ChevronRight } from "lucide-react";
import { FREE_SUBJECT_LIMIT } from "@/lib/utils";

interface Subject {
  id: string; name: string; nameAr: string | null; color: string; icon: string;
  _count: { chapters: number; tasks: number };
  chapters: { isCompleted: boolean }[];
}

export default function SubjectsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    const res = await fetch("/api/subjects");
    if (res.ok) setSubjects(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchSubjects(); }, []);

  const deleteSubject = async (id: string) => {
    if (!confirm(t("deleteConfirm") + "\n" + t("deleteWarning"))) return;
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    setSubjects((s) => s.filter((x) => x.id !== id));
  };

  const atLimit = !session?.user?.isPremium && subjects.length >= FREE_SUBJECT_LIMIT;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("subjects")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {subjects.length}{!session?.user?.isPremium ? `/${FREE_SUBJECT_LIMIT}` : ""} {t("subjects")}
          </p>
        </div>
        {!atLimit ? (
          <Link href="/subjects/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> {t("create")}
          </Link>
        ) : (
          <Link href="/settings" className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
            <Crown size={16} /> {t("upgrade")}
          </Link>
        )}
      </div>

      {atLimit && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Crown size={20} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">{t("subjectLimitReached")}</p>
            <p className="text-sm text-amber-600 mt-0.5">{t("subjectLimitDesc")}</p>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-700">{t("noSubjects")}</h3>
          <p className="text-gray-400 text-sm mt-1">{t("addFirstSubject")}</p>
          <Link href="/subjects/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> {t("add")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => {
            const completed = s.chapters.filter((c) => c.isCompleted).length;
            const total = s.chapters.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow group">
                <Link href={`/subjects/${s.id}`} className="block p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: s.color + "20" }}>
                        {s.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{s.name}</h3>
                        {s.nameAr && <p className="text-xs text-gray-400" dir="rtl">{s.nameAr}</p>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 mt-1" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>📚 {s._count.chapters} {t("chapters")}</span>
                    <span>✅ {s._count.tasks} {t("tasks")}</span>
                  </div>

                  {total > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{t("progress")}</span>
                        <span className="font-medium" style={{ color: s.color }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                      </div>
                    </div>
                  )}
                </Link>
                <div className="border-t border-gray-100 px-5 py-2 flex justify-end">
                  <button onClick={() => deleteSubject(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
