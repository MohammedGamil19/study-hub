"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Clock, Edit2, Bell } from "lucide-react";
import { getDayName, formatTime } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";

interface ScheduleEvent { id: string; title: string; dayOfWeek: number; startTime: string; endTime: string; notifyBefore: number; }

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function SchedulePage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const { language } = useAppStore();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState({ title: "", dayOfWeek: 0, startTime: "09:00", endTime: "11:00", notifyBefore: 15 });

  const fetch_ = async () => {
    const res = await fetch(`/api/schedule?subjectId=${subjectId}`);
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, [subjectId]);

  const openEdit = (ev: ScheduleEvent) => {
    setEditing(ev);
    setForm({ title: ev.title, dayOfWeek: ev.dayOfWeek, startTime: ev.startTime, endTime: ev.endTime, notifyBefore: ev.notifyBefore });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/schedule/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, ...form }) });
    }
    setShowForm(false); setEditing(null); setForm({ title: "", dayOfWeek: 0, startTime: "09:00", endTime: "11:00", notifyBefore: 15 });
    await fetch_();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    setEvents((e) => e.filter((x) => x.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{t("schedule")}</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={15} /> {t("addSchedule")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">{editing ? t("editSchedule") : t("addSchedule")}</h3>
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
              <label className="text-xs text-gray-500 mb-1 block">{t("notifications")}</label>
              <select value={form.notifyBefore} onChange={(e) => setForm({ ...form, notifyBefore: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
              </select>
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

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">📅</div><p>{t("noSchedule")}</p></div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day) => {
            const dayEvents = events.filter((e) => e.dayOfWeek === day);
            if (!dayEvents.length) return null;
            return (
              <div key={day}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{getDayName(day, language, true)}</h3>
                <div className="space-y-2">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 group hover:border-indigo-200">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock size={11} />{formatTime(ev.startTime)} – {formatTime(ev.endTime)}</span>
                          <span className="flex items-center gap-1"><Bell size={11} />{ev.notifyBefore}m</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button onClick={() => openEdit(ev)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600"><Edit2 size={13} /></button>
                        <button onClick={() => deleteEvent(ev.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
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
