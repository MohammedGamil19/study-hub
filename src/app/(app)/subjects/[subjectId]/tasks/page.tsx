"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, CheckCircle2, Circle, Trash2, AlertCircle, Clock, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Task { id: string; title: string; description?: string; dueDate?: string; priority: string; status: string; completedAt?: string; }

const priorityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  HIGH: { color: "text-red-500", icon: <AlertCircle size={14} /> },
  MEDIUM: { color: "text-amber-500", icon: <Clock size={14} /> },
  LOW: { color: "text-gray-400", icon: <Minus size={14} /> },
};

export default function TasksPage() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  const fetch_ = async () => {
    const res = await fetch(`/api/tasks?subjectId=${subjectId}`);
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, [subjectId]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, title, dueDate: dueDate || null, priority }),
    });
    if (res.ok) { setTitle(""); setDueDate(""); setPriority("MEDIUM"); setShowForm(false); await fetch_(); }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      if (newStatus === "COMPLETED" && data.pointsResult) {
        setToast(`+${data.pointsResult.points} ${t("points")} 🎉`);
        setTimeout(() => setToast(""), 3000);
      }
      await fetch_();
    }
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((t) => t.filter((x) => x.id !== id));
  };

  const pending = tasks.filter((t) => t.status !== "COMPLETED");
  const completed = tasks.filter((t) => t.status === "COMPLETED");

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {toast && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 animate-bounce">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">{pending.length} {t("pending")} · {completed.length} {t("done")}</div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
          <Plus size={15} /> {t("addTask")}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addTask} className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("title") + " *"} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="LOW">{t("low")}</option>
              <option value="MEDIUM">{t("medium")}</option>
              <option value="HIGH">{t("high")}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm">{t("cancel")}</button>
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">{t("add")}</button>
          </div>
        </form>
      )}

      {/* Pending tasks */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <p>{t("noTasks")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((task) => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} t={t} />)}
          {completed.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">{t("completed")}</p>
              {completed.map((task) => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} t={t} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete, t }: { task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void; t: any }) {
  const pc = priorityConfig[task.priority];
  const done = task.status === "COMPLETED";
  return (
    <div className={cn("flex items-start gap-3 bg-white border rounded-xl px-4 py-3 group", done ? "border-gray-100 bg-gray-50" : "border-gray-200 hover:border-indigo-200")}>
      <button onClick={() => onToggle(task)} className="mt-0.5 shrink-0">
        {done ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} className="text-gray-300 hover:text-indigo-400" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", done && "line-through text-gray-400")}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("flex items-center gap-0.5 text-xs", pc.color)}>{pc.icon}{t(task.priority.toLowerCase())}</span>
          {task.dueDate && <span className="text-xs text-gray-400">{format(new Date(task.dueDate), "MMM d")}</span>}
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 mt-0.5 shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
