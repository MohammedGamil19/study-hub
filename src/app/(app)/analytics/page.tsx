"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Lock, Crown, BarChart2 } from "lucide-react";
import Link from "next/link";
import { format, subDays } from "date-fns";

interface AnalyticsData {
  studyByDate: { date: string; mins: number }[];
  studyBySubject: { name: string; color: string; mins: number }[];
  tasksByDate: { date: string; count: number }[];
  totalMins: number;
  totalTasks: number;
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/analytics?from=${from}&to=${to}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (session?.user?.isPremium) fetchData(); }, [session]);

  if (!session?.user?.isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
          <Lock size={36} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("premiumFeature")}</h2>
        <p className="text-gray-500 max-w-sm mb-6">{t("upgradeDesc")}</p>
        <Link href="/settings" className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold">
          <Crown size={18} /> {t("upgrade")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 size={24} className="text-indigo-500" /> {t("analytics")}
        </h1>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <span className="text-gray-400 text-sm">{t("to")}</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={fetchData} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            {t("apply")}
          </button>
        </div>
      </div>

      {loading && <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label={t("totalStudyTime")} value={`${Math.floor(data.totalMins / 60)}h ${data.totalMins % 60}m`} color="text-indigo-600" />
            <SummaryCard label={t("completed") + " " + t("tasks")} value={data.totalTasks} color="text-green-600" />
            <SummaryCard label={t("avgPerDay")} value={`${Math.round(data.totalMins / Math.max(data.studyByDate.length, 1))}m`} color="text-purple-600" />
            <SummaryCard label={t("subjects")} value={data.studyBySubject.length} color="text-orange-600" />
          </div>

          {/* Study hours chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{t("studyHours")} ({t("minutesPerDay")})</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.studyByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => format(new Date(d), "MMM d")} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} min`, "Study"]} labelFormatter={(d) => format(new Date(d), "MMM d, yyyy")} />
                <Bar dataKey="mins" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks chart */}
          {data.tasksByDate.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{t("tasksCompletedPerDay")}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.tasksByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => format(new Date(d), "MMM d")} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(d) => format(new Date(d), "MMM d, yyyy")} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Tasks" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By subject */}
          {data.studyBySubject.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{t("studyHours")} {t("bySubject")}</h3>
              <div className="space-y-3">
                {data.studyBySubject.sort((a, b) => b.mins - a.mins).map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{s.name}</span>
                      <span className="text-gray-400">{Math.floor(s.mins / 60)}h {s.mins % 60}m</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min((s.mins / data.totalMins) * 100, 100)}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
