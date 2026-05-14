"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, FileText, MapPin, Edit2 } from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface Exam { id: string; title: string; type: string; scheduledAt: string; location?: string; notes?: string; }

const TYPE_COLORS: Record<string, string> = {
  EXAM: "bg-red-100 text-red-700", QUIZ: "bg-orange-100 text-orange-700",
  MIDTERM: "bg-purple-100 text-purple-700", FINAL: "bg-rose-100 text-rose-700",
};

export default function ExamsPage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState({ title: "", type: "EXAM", scheduledAt: "", location: "", notes: "" });

  const fetch_ = async () => { const r = await fetch(`/api/exams?subjectId=${subjectId}`); if (r.ok) setExams(await r.json()); setLoading(false); };
  useEffect(() => { fetch_(); }, [subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/exams/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, ...form }) });
    }
    setShowForm(false); setEditing(null); setForm({ title: "", type: "EXAM", scheduledAt: "", location: "", notes: "" }); await fetch_();
  };

  const deleteExam = async (id: string) => { await fetch(`/api/exams/${id}`, { method: "DELETE" }); setExams((e) => e.filter((x) => x.id !== id)); };

  const upcoming = exams.filter((e) => !isPast(new Date(e.scheduledAt)));
  const past = exams.filter((e) => isPast(new Date(e.scheduledAt)));

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{upcoming.length} {t("upcoming")}</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={15} /> {t("addExam")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <input type="text" placeholder={t("title") + " *"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("type")}</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="EXAM">{t("exam")}</option>
                <option value="QUIZ">{t("quiz")}</option>
                <option value="MIDTERM">{t("midterm")}</option>
                <option value="FINAL">{t("final")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("location")}</label>
              <input type="text" placeholder="Hall A..." value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t("dueDate")} *</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <textarea placeholder={t("notes") + "..."} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm">{t("cancel")}</button>
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">{editing ? t("update") : t("add")}</button>
          </div>
        </form>
      )}

      {exams.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">📝</div><p>{t("noExams")}</p></div>
      ) : (
        <div className="space-y-2">
          {upcoming.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-1">{t("upcoming")}</p>}
          {upcoming.map((ex) => <ExamCard key={ex.id} exam={ex} onDelete={deleteExam} onEdit={(e) => { setEditing(e); setForm({ title: e.title, type: e.type, scheduledAt: e.scheduledAt.slice(0,16), location: e.location||"", notes: e.notes||"" }); setShowForm(true); }} t={t} />)}
          {past.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">{t("past")}</p>}
          {past.map((ex) => <ExamCard key={ex.id} exam={ex} onDelete={deleteExam} onEdit={(e) => { setEditing(e); setForm({ title: e.title, type: e.type, scheduledAt: e.scheduledAt.slice(0,16), location: e.location||"", notes: e.notes||"" }); setShowForm(true); }} t={t} dimmed />)}
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam, onDelete, onEdit, t, dimmed }: { exam: Exam; onDelete: (id: string) => void; onEdit: (e: Exam) => void; t: any; dimmed?: boolean }) {
  return (
    <div className={cn("flex items-start gap-3 bg-white border rounded-xl px-4 py-3 group", dimmed ? "border-gray-100 opacity-60" : "border-gray-200 hover:border-indigo-200")}>
      <FileText size={18} className="text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-gray-800">{exam.title}</p>
          <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[exam.type] || "bg-gray-100 text-gray-600")}>{t(exam.type.toLowerCase())}</span>
        </div>
        <p className="text-xs text-gray-400">{format(new Date(exam.scheduledAt), "EEE, MMM d yyyy · h:mm a")}</p>
        {exam.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{exam.location}</p>}
        {exam.notes && <p className="text-xs text-gray-400 mt-0.5">{exam.notes}</p>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <button onClick={() => onEdit(exam)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600"><Edit2 size={13} /></button>
        <button onClick={() => onDelete(exam.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}
