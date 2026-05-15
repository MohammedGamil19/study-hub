"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { invalidateCache } from "@/lib/clientCache";

const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#14b8a6"];
const ICONS = ["📚","🧮","🔬","💻","🌍","📖","🎨","🏛️","⚗️","🧬","📐","🎵","🏃","💡","📝","🌱"];

export default function NewSubjectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t("requiredField")); return; }
    setLoading(true);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, nameAr, color, icon }),
    });
    if (res.ok) {
      const s = await res.json();
      invalidateCache("subjects", "dashboard");
      router.push(`/subjects/${s.id}`);
    } else {
      const d = await res.json();
      setError(d.error === "SUBJECT_LIMIT_REACHED" ? t("subjectLimitReached") : t("error"));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/subjects" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{t("create")} {t("subjects").slice(0,-1)}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-sm" style={{ backgroundColor: color + "20", border: `2px solid ${color}40` }}>
              {icon}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("subjectIcon")}</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${icon === i ? "ring-2 ring-indigo-500 bg-indigo-50 scale-110" : "bg-gray-50 hover:bg-gray-100"}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("subjectColor")}</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("subjectName")} *</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Mathematics, Physics..." />
          </div>

          {/* Arabic name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("arabicName")}</label>
            <input
              type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
              placeholder="مثال: الرياضيات، الفيزياء..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/subjects" className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium text-center hover:bg-gray-50">
              {t("cancel")}
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
              {loading ? t("loading") : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
