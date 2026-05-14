"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Clock, MapPin, Edit2 } from "lucide-react";
import { getDayName, formatTime } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";

interface Lecture { id: string; title: string; dayOfWeek: number; startTime: string; endTime: string; location?: string; isActive: boolean; }
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function LecturesPage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const { language } = useAppStore();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lecture | null>(null);
  const [form, setForm] = useState({ title: "", dayOfWeek: 0, startTime: "08:00", endTime: "10:00", location: "" });

  const fetch_ = async () => { const r = await fetch(`/api/lectures?subjectId=${subjectId}`); if (r.ok) setLectures(await r.json()); setLoading(false); };
  useEffect(() => { fetch_(); }, [subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/lectures/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/lectures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, ...form }) });
    }
    setShowForm(false); setEditing(null); setForm({ title: "", dayOfWeek: 0, startTime: "08:00", endTime: "10:00", location: "" }); await fetch_();
  };

  const deleteLecture = async (id: string) => { await fetch(`/api/lectures/${id}`, { method: "DELETE" }); setLectures((l) => l.filter((x) => x.id !== id)); };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{t("lectures")}</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={15} /> {t("addLecture")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <input type="text" placeholder={t("title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("day")}</label>
              <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {DAYS.map((d) => <option key={d} value={d}>{getDayName(d, language, true)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("location")}</label>
              <input type="text" placeholder="Hall A, Online..." value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("startTime")}</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("endTime")}</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm">{t("cancel")}</button>
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">{editing ? t("update") : t("add")}</button>
          </div>
        </form>
      )}

      {lectures.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">🎓</div><p>{t("noLectures")}</p></div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day) => {
            const dl = lectures.filter((l) => l.dayOfWeek === day);
            if (!dl.length) return null;
            return (
              <div key={day}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{getDayName(day, language, true)}</h3>
                <div className="space-y-2">
                  {dl.map((lec) => (
                    <div key={lec.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 group hover:border-indigo-200">
                      <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{lec.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock size={11} />{formatTime(lec.startTime)} – {formatTime(lec.endTime)}</span>
                          {lec.location && <span className="flex items-center gap-1"><MapPin size={11} />{lec.location}</span>}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button onClick={() => { setEditing(lec); setForm({ title: lec.title, dayOfWeek: lec.dayOfWeek, startTime: lec.startTime, endTime: lec.endTime, location: lec.location || "" }); setShowForm(true); }} className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600"><Edit2 size={13} /></button>
                        <button onClick={() => deleteLecture(lec.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
