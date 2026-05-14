"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { signOut } from "next-auth/react";
import { format, formatDistanceToNow } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, Crown, TrendingUp, BookOpen, Clock, CheckSquare, Star, Shield,
  Search, Trash2, LayoutDashboard, Activity, RefreshCw, LogOut,
  ChevronUp, ChevronDown, Zap, RotateCcw, FileText, Timer,
  AlertTriangle, X, Check, Globe, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ADMIN_EMAIL = "mohamadshogaa7712@gmail.com";
const PIE_COLORS = ["#f59e0b", "#e5e7eb"];

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatsData {
  totalUsers: number; premiumUsers: number; freeUsers: number;
  newUsersThisWeek: number; totalSubjects: number; totalChapters: number;
  completedChapters: number; totalTasks: number; completedTasks: number;
  totalPomodoro: number; totalStudyMins: number; totalPoints: number;
  activeSessions: number; totalReviews: number; completedReviews: number;
  totalExams: number;
}

interface AdminUser {
  id: string; name: string | null; email: string; isPremium: boolean;
  premiumSince: string | null; createdAt: string; image: string | null;
  language: string; studyMins: number;
  _count: { subjects: number };
  streakRecord: { currentStreak: number; longestStreak: number; totalPoints: number } | null;
}

interface PomodoroEntry {
  id: string; durationMins: number; type: string; startedAt: string; createdAt: string;
  user: { email: string; name: string | null };
  subject: { name: string; icon: string; color: string };
}

interface PointEntry {
  id: string; points: number; reason: string; createdAt: string; multiplier: number;
  user: { email: string; name: string | null };
}

interface ChartPoint { date: string; users: number; cumulative: number; }

interface AdminData {
  stats: StatsData;
  users: AdminUser[];
  recentPomodoro: PomodoroEntry[];
  recentPoints: PointEntry[];
  registrationChart: ChartPoint[];
}

type Tab = "overview" | "users" | "activity";
type SortKey = "name" | "email" | "createdAt" | "studyMins" | "points" | "subjects";
type SortDir = "asc" | "desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function avatarLetter(user: AdminUser) {
  return (user.name?.[0] || user.email[0]).toUpperCase();
}

function reasonLabel(reason: string) {
  return reason
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, gradient, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; gradient: string; trend?: string;
}) {
  return (
    <div className={cn("rounded-2xl p-5 text-white relative overflow-hidden", gradient)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/5 rounded-full" />
    </div>
  );
}

function Badge({ premium }: { premium: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
      premium ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
    )}>
      {premium ? <><Crown size={10} /> Premium</> : "Free"}
    </span>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-red-600 font-medium whitespace-nowrap">Delete?</span>
      <button onClick={onConfirm} className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded">
        <Check size={12} />
      </button>
      <button onClick={onCancel} className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded">
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "premium" | "free">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setData(await res.json());
      else showToast("Failed to load data", "error");
    } catch {
      showToast("Network error", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const togglePremium = async (user: AdminUser) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: !user.isPremium }),
      });
      if (res.ok) {
        setData((d) => d ? {
          ...d,
          users: d.users.map((u) =>
            u.id === user.id ? { ...u, isPremium: !u.isPremium } : u
          ),
          stats: {
            ...d.stats,
            premiumUsers: d.stats.premiumUsers + (user.isPremium ? -1 : 1),
            freeUsers: d.stats.freeUsers + (user.isPremium ? 1 : -1),
          },
        } : d);
        showToast(`${user.email} → ${!user.isPremium ? "Premium" : "Free"}`);
      } else {
        showToast("Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
    setTogglingId(null);
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((d) => d ? {
          ...d,
          users: d.users.filter((u) => u.id !== id),
          stats: {
            ...d.stats,
            totalUsers: d.stats.totalUsers - 1,
            premiumUsers: d.stats.premiumUsers - (d.users.find(u => u.id === id)?.isPremium ? 1 : 0),
          },
        } : d);
        showToast("User deleted");
      } else {
        const e = await res.json();
        showToast(e.error || "Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
    setDeletingId(null);
  };

  // Sorted + filtered users
  const filteredUsers = useMemo(() => {
    if (!data) return [];
    let list = data.users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name || "").toLowerCase().includes(q)
      );
    }
    if (planFilter === "premium") list = list.filter((u) => u.isPremium);
    if (planFilter === "free") list = list.filter((u) => !u.isPremium);

    list = [...list].sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case "name": va = (a.name || a.email).toLowerCase(); vb = (b.name || b.email).toLowerCase(); break;
        case "email": va = a.email; vb = b.email; break;
        case "createdAt": va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); break;
        case "studyMins": va = a.studyMins; vb = b.studyMins; break;
        case "points": va = a.streakRecord?.totalPoints || 0; vb = b.streakRecord?.totalPoints || 0; break;
        case "subjects": va = a._count.subjects; vb = b._count.subjects; break;
      }
      return sortDir === "asc" ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
    return list;
  }, [data, search, planFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === "asc" ? <ChevronUp size={13} className="text-indigo-600" /> : <ChevronDown size={13} className="text-indigo-600" />
      : <ChevronDown size={13} className="text-gray-300" />;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading admin panel...</p>
      </div>
    </div>
  );

  const s = data?.stats;
  const pieData = [
    { name: "Premium", value: s?.premiumUsers || 0 },
    { name: "Free", value: s?.freeUsers || 0 },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right",
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? <Check size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">StudyHub</p>
              <p className="text-indigo-400 text-xs font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">M</div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">Admin</p>
              <p className="text-gray-500 text-xs truncate">{ADMIN_EMAIL.split("@")[0]}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {([
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "users", label: "Users", icon: Users },
            { id: "activity", label: "Activity", icon: Activity },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                tab === id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon size={17} />
              {label}
              {id === "users" && s && (
                <span className="ml-auto text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
                  {s.totalUsers}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick stats in sidebar */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Active Sessions</span>
            <span className="text-green-400 font-semibold">{s?.activeSessions || 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Premium Rate</span>
            <span className="text-amber-400 font-semibold">
              {s?.totalUsers ? Math.round((s.premiumUsers / s.totalUsers) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Completion Rate</span>
            <span className="text-indigo-400 font-semibold">
              {s?.totalTasks ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all w-full"
          >
            <BookOpen size={17} />
            Back to App
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-all w-full"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Header bar */}
        <div className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg capitalize">
              {tab === "overview" && "Dashboard Overview"}
              {tab === "users" && "User Management"}
              {tab === "activity" && "Recent Activity"}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Last updated: {format(new Date(), "MMM d, yyyy · HH:mm")}
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="p-8 space-y-8">

          {/* ══ OVERVIEW TAB ══════════════════════════════════════════════ */}
          {tab === "overview" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={fmtNum(s?.totalUsers || 0)}
                  sub={`+${s?.newUsersThisWeek || 0} this week`}
                  icon={Users} gradient="bg-gradient-to-br from-blue-600 to-blue-700"
                  trend={`${s?.newUsersThisWeek || 0} new this week`} />
                <StatCard label="Premium Users" value={s?.premiumUsers || 0}
                  sub={`${s?.totalUsers ? Math.round((s.premiumUsers / s.totalUsers) * 100) : 0}% of total`}
                  icon={Crown} gradient="bg-gradient-to-br from-amber-500 to-yellow-600" />
                <StatCard label="Active Sessions" value={s?.activeSessions || 0}
                  sub="Currently valid tokens"
                  icon={Zap} gradient="bg-gradient-to-br from-green-600 to-emerald-700" />
                <StatCard label="New This Week" value={s?.newUsersThisWeek || 0}
                  sub="Registered users"
                  icon={TrendingUp} gradient="bg-gradient-to-br from-purple-600 to-violet-700" />
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Total Subjects" value={fmtNum(s?.totalSubjects || 0)}
                  sub="Across all users"
                  icon={BookOpen} gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
                <StatCard label="Study Hours" value={fmtMins(s?.totalStudyMins || 0)}
                  sub={`${s?.totalPomodoro || 0} sessions`}
                  icon={Clock} gradient="bg-gradient-to-br from-cyan-600 to-teal-700" />
                <StatCard label="Tasks Completed" value={fmtNum(s?.completedTasks || 0)}
                  sub={`of ${fmtNum(s?.totalTasks || 0)} total`}
                  icon={CheckSquare} gradient="bg-gradient-to-br from-green-600 to-green-700" />
                <StatCard label="Points Awarded" value={fmtNum(s?.totalPoints || 0)}
                  sub="Total across all users"
                  icon={Star} gradient="bg-gradient-to-br from-orange-500 to-red-600" />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Registration trend */}
                <div className="xl:col-span-2 bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <h3 className="text-white font-semibold mb-1">User Growth</h3>
                  <p className="text-gray-500 text-xs mb-5">Cumulative registrations — last 30 days</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data?.registrationChart || []}>
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }}
                        tickFormatter={(d) => format(new Date(d + "T12:00:00"), "MMM d")} />
                      <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "#9ca3af" }}
                        itemStyle={{ color: "#a5b4fc" }}
                        labelFormatter={(d) => format(new Date(d + "T12:00:00"), "MMM d, yyyy")}
                      />
                      <Area type="monotone" dataKey="cumulative" name="Total Users"
                        stroke="#6366f1" strokeWidth={2} fill="url(#cg)" />
                      <Area type="monotone" dataKey="users" name="New Today"
                        stroke="#10b981" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Plan distribution */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <h3 className="text-white font-semibold mb-1">Plan Distribution</h3>
                  <p className="text-gray-500 text-xs mb-4">Premium vs Free users</p>
                  <div className="flex items-center justify-center">
                    <PieChart width={180} height={180}>
                      <Pie data={pieData} cx={90} cy={90} innerRadius={55} outerRadius={80}
                        paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                        itemStyle={{ color: "#e5e7eb" }}
                      />
                    </PieChart>
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                          <span className="text-gray-400">{d.name}</span>
                        </div>
                        <span className="text-white font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Chapters Progress", done: s?.completedChapters || 0, total: s?.totalChapters || 0, color: "bg-green-500", icon: CheckSquare },
                  { label: "Reviews Completed", done: s?.completedReviews || 0, total: s?.totalReviews || 0, color: "bg-cyan-500", icon: RotateCcw },
                  { label: "Tasks Finished", done: s?.completedTasks || 0, total: s?.totalTasks || 0, color: "bg-indigo-500", icon: CheckSquare },
                ].map(({ label, done, total, color, icon: Icon }) => {
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={16} className="text-gray-400" />
                        <span className="text-gray-300 text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-2xl font-bold text-white">{pct}%</span>
                        <span className="text-gray-500 text-xs">{done}/{total}</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top users by study time */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                  <Timer size={17} className="text-indigo-400" />
                  Top Users by Study Time
                </h3>
                <div className="space-y-3">
                  {[...(data?.users || [])]
                    .sort((a, b) => b.studyMins - a.studyMins)
                    .slice(0, 5)
                    .map((u, i) => (
                      <div key={u.id} className="flex items-center gap-4">
                        <span className="w-6 text-center text-xs font-bold text-gray-500">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {avatarLetter(u)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{u.name || u.email}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        {u.isPremium && <Crown size={13} className="text-amber-400 shrink-0" />}
                        <span className="text-indigo-400 text-sm font-semibold tabular-nums">{fmtMins(u.studyMins)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* ══ USERS TAB ════════════════════════════════════════════════ */}
          {tab === "users" && (
            <div className="space-y-5">
              {/* Filters bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-60">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-xl p-1">
                  {(["all", "premium", "free"] as const).map((f) => (
                    <button key={f} onClick={() => setPlanFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                        planFilter === f ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                      )}>
                      {f} {f === "all" ? `(${data?.users.length || 0})` : f === "premium" ? `(${s?.premiumUsers || 0})` : `(${s?.freeUsers || 0})`}
                    </button>
                  ))}
                </div>
                <span className="text-gray-500 text-xs">{filteredUsers.length} users</span>
              </div>

              {/* Table */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {[
                          { key: "name" as SortKey, label: "User" },
                          { key: "email" as SortKey, label: "Email", hide: true },
                          { key: null, label: "Plan" },
                          { key: "subjects" as SortKey, label: "Subjects" },
                          { key: "studyMins" as SortKey, label: "Study Time" },
                          { key: "points" as SortKey, label: "Points" },
                          { key: null, label: "Streak" },
                          { key: "createdAt" as SortKey, label: "Joined" },
                          { key: null, label: "Actions" },
                        ].map(({ key, label, hide }) => (
                          <th key={label}
                            className={cn("px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap", hide && "hidden lg:table-cell")}>
                            {key ? (
                              <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                {label} <SortIcon k={key} />
                              </button>
                            ) : label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-800/40 transition-colors group">
                          {/* User */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                                u.isPremium ? "bg-amber-600" : "bg-indigo-700"
                              )}>
                                {avatarLetter(u)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate max-w-28">
                                  {u.name || "—"}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-28 lg:hidden">
                                  {u.email}
                                </p>
                                {u.email === ADMIN_EMAIL && (
                                  <span className="text-xs text-indigo-400 font-medium">Admin</span>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Email */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-gray-400 font-mono">{u.email}</span>
                          </td>
                          {/* Plan */}
                          <td className="px-4 py-3"><Badge premium={u.isPremium} /></td>
                          {/* Subjects */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <BookOpen size={13} className="text-gray-600" />
                              <span className="text-sm text-gray-300">{u._count.subjects}</span>
                            </div>
                          </td>
                          {/* Study Time */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-gray-600" />
                              <span className="text-sm text-gray-300 tabular-nums">{fmtMins(u.studyMins)}</span>
                            </div>
                          </td>
                          {/* Points */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Star size={13} className="text-amber-600" />
                              <span className="text-sm text-gray-300">{u.streakRecord?.totalPoints || 0}</span>
                            </div>
                          </td>
                          {/* Streak */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Flame size={13} className="text-orange-500" />
                              <span className="text-sm text-gray-300">{u.streakRecord?.currentStreak || 0}d</span>
                            </div>
                          </td>
                          {/* Joined */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {format(new Date(u.createdAt), "MMM d, yyyy")}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            {deletingId === u.id ? (
                              <DeleteConfirm
                                onConfirm={() => deleteUser(u.id)}
                                onCancel={() => setDeletingId(null)}
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                {/* Toggle premium */}
                                <button
                                  onClick={() => togglePremium(u)}
                                  disabled={togglingId === u.id}
                                  title={u.isPremium ? "Revoke Premium" : "Grant Premium"}
                                  className={cn(
                                    "p-1.5 rounded-lg transition-all text-xs",
                                    u.isPremium
                                      ? "bg-amber-900/40 text-amber-400 hover:bg-amber-900/60"
                                      : "bg-gray-800 text-gray-500 hover:text-amber-400 hover:bg-amber-900/30",
                                    togglingId === u.id && "opacity-50"
                                  )}
                                >
                                  <Crown size={13} />
                                </button>
                                {/* Delete */}
                                {u.email !== ADMIN_EMAIL && (
                                  <button
                                    onClick={() => setDeletingId(u.id)}
                                    title="Delete user"
                                    className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-all"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                                {/* Language flag */}
                                <span className="text-base" title={`Language: ${u.language}`}>
                                  {u.language === "ar" ? "🇸🇦" : "🇺🇸"}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-16 text-gray-600">
                    <Users size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No users found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ACTIVITY TAB ══════════════════════════════════════════════ */}
          {tab === "activity" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Recent Registrations */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  New Registrations
                </h3>
                <div className="space-y-3">
                  {[...(data?.users || [])]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((u) => (
                      <div key={u.id} className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                          u.isPremium ? "bg-amber-600" : "bg-blue-700"
                        )}>
                          {avatarLetter(u)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{u.name || u.email}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge premium={u.isPremium} />
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Pomodoro Sessions */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Timer size={16} className="text-purple-400" />
                  Pomodoro Sessions
                </h3>
                <div className="space-y-3">
                  {(data?.recentPomodoro || []).map((p) => (
                    <div key={p.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ backgroundColor: p.subject.color + "25" }}>
                        {p.subject.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{p.subject.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.user.email}</p>
                        <p className="text-xs text-gray-600">
                          {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-purple-400">{p.durationMins}m</p>
                        <p className="text-xs text-gray-600">{p.type}</p>
                      </div>
                    </div>
                  ))}
                  {!data?.recentPomodoro?.length && (
                    <p className="text-gray-600 text-sm text-center py-8">No sessions yet</p>
                  )}
                </div>
              </div>

              {/* Recent Points */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Star size={16} className="text-amber-400" />
                  Points Awarded
                </h3>
                <div className="space-y-3">
                  {(data?.recentPoints || []).map((pt) => (
                    <div key={pt.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Star size={14} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {reasonLabel(pt.reason)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {pt.user.name || pt.user.email}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDistanceToNow(new Date(pt.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-400">+{pt.points}</p>
                        {pt.multiplier > 1 && (
                          <p className="text-xs text-amber-600">×{pt.multiplier}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {!data?.recentPoints?.length && (
                    <p className="text-gray-600 text-sm text-center py-8">No points awarded yet</p>
                  )}
                </div>
              </div>

              {/* Extra stats cards spanning full width */}
              <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Exams", value: s?.totalExams || 0, icon: FileText, color: "text-red-400" },
                  { label: "Total Reviews", value: s?.totalReviews || 0, icon: RotateCcw, color: "text-cyan-400" },
                  { label: "Reviews Done", value: s?.completedReviews || 0, icon: CheckSquare, color: "text-green-400" },
                  { label: "Total Chapters", value: s?.totalChapters || 0, icon: BookOpen, color: "text-indigo-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                      <Icon size={18} className={color} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{fmtNum(value)}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
