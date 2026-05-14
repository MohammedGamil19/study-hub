"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, CheckCircle2, Circle, Trash2, GripVertical, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter { id: string; title: string; orderIndex: number; isCompleted: boolean; completedAt: string | null; }

export default function ChaptersPage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");

  const fetch_ = async () => {
    const res = await fetch(`/api/chapters?subjectId=${subjectId}`);
    if (res.ok) setChapters(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, [subjectId]);

  const addChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, title: newTitle }),
    });
    if (res.ok) { setNewTitle(""); await fetch_(); }
    setAdding(false);
  };

  const toggleComplete = async (ch: Chapter) => {
    const res = await fetch(`/api/chapters/${ch.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !ch.isCompleted }),
    });
    if (res.ok) {
      const data = await res.json();
      if (!ch.isCompleted && data.pointsResult) {
        setToast(`+${data.pointsResult.points} ${t("points")} 🎉`);
        setTimeout(() => setToast(""), 3000);
      }
      await fetch_();
    }
  };

  const deleteChapter = async (id: string) => {
    await fetch(`/api/chapters/${id}`, { method: "DELETE" });
    setChapters((c) => c.filter((x) => x.id !== id));
  };

  const completed = chapters.filter((c) => c.isCompleted).length;
  const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 animate-bounce">
          {toast}
        </div>
      )}

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{completed}/{chapters.length} {t("chapters")}</span>
          <span className="text-sm font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={addChapter} className="flex gap-2 mb-4">
        <input
          type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("addChapter") + "..."}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={adding || !newTitle.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1">
          <Plus size={16} /> {t("add")}
        </button>
      </form>

      {/* Chapter list */}
      {chapters.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BookMarkedIcon />
          <p className="mt-2">{t("noChapters")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chapters.map((ch) => (
            <div key={ch.id} className={cn(
              "flex items-center gap-3 bg-white border rounded-xl px-4 py-3 group transition-all",
              ch.isCompleted ? "border-green-200 bg-green-50" : "border-gray-200 hover:border-indigo-200"
            )}>
              <GripVertical size={16} className="text-gray-300 shrink-0 cursor-grab" />
              <button onClick={() => toggleComplete(ch)} className="shrink-0">
                {ch.isCompleted
                  ? <CheckCircle2 size={22} className="text-green-500" />
                  : <Circle size={22} className="text-gray-300 hover:text-indigo-400" />}
              </button>
              <span className={cn("flex-1 text-sm font-medium", ch.isCompleted && "line-through text-gray-400")}>
                {ch.title}
              </span>
              {ch.isCompleted && <Star size={14} className="text-amber-400" />}
              <button onClick={() => deleteChapter(ch.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookMarkedIcon() {
  return <div className="text-4xl mb-2">📚</div>;
}
