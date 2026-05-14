"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, CheckCircle2, Clock, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Review { id: string; title: string; scheduledAt: string; status: string; notes?: string; pointsAwarded?: number; }

export default function ReviewsPage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", scheduledAt: "", notes: "" });
  const [toast, setToast] = useState("");

  const fetch_ = async () => { const r = await fetch(`/api/reviews?subjectId=${subjectId}`); if (r.ok) setReviews(await r.json()); setLoading(false); };
  useEffect(() => { fetch_(); }, [subjectId]);

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, ...form }) });
    setShowForm(false); setForm({ title: "", scheduledAt: "", notes: "" }); await fetch_();
  };

  const complete = async (id: string) => {
    const res = await fetch(`/api/reviews/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) });
    if (res.ok) {
      const data = await res.json();
      if (data.pointsResult) { setToast(`+${data.pointsResult.points} ${t("points")} 🎉`); setTimeout(() => setToast(""), 3000); }
      await fetch_();
    }
  };

  const deleteReview = async (id: string) => { await fetch(`/api/reviews/${id}`, { method: "DELETE" }); setReviews((r) => r.filter((x) => x.id !== id)); };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  const pending = reviews.filter((r) => r.status === "PENDING");
  const completed = reviews.filter((r) => r.status === "COMPLETED");

  return (
    <div>
      {toast && <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 animate-bounce">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{pending.length} {t("pending")} · {completed.length} {t("done")}</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={15} /> {t("addReview")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addReview} className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <input type="text" placeholder={t("title") + " *"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t("dueDate")}</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <textarea placeholder={t("notes") + "..."} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm">{t("cancel")}</button>
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">{t("add")}</button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">🔄</div><p>{t("noReviews")}</p></div>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => (
            <div key={r.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 group hover:border-cyan-200">
              <Clock size={18} className="text-cyan-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{r.title}</p>
                <p className="text-xs text-gray-400">{format(new Date(r.scheduledAt), "MMM d, yyyy · h:mm a")}</p>
                {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => complete(r.id)} className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100">{t("markDone")}</button>
                <button onClick={() => deleteReview(r.id)} className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {completed.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">{t("completed")}</p>
              {completed.map((r) => (
                <div key={r.id} className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 group">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 line-through">{r.title}</p>
                    <p className="text-xs text-gray-400">{format(new Date(r.scheduledAt), "MMM d, yyyy")}</p>
                  </div>
                  {r.pointsAwarded && <span className="flex items-center gap-0.5 text-xs text-amber-500"><Star size={11} />+{r.pointsAwarded}</span>}
                  <button onClick={() => deleteReview(r.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
