"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/stores/useAppStore";
import {
  LayoutDashboard, BookOpen, BarChart2, Sparkles, Settings, LogOut, Crown, Flame, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { language } = useAppStore();
  const isRTL = language === "ar";

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/subjects", label: t("subjects"), icon: BookOpen },
    { href: "/analytics", label: t("analytics"), icon: BarChart2, premium: true },
    { href: "/summarizer", label: t("summarizer"), icon: Sparkles, premium: true },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 h-full w-64 bg-white z-40 flex flex-col transition-transform duration-300",
          // Position: right side in Arabic, left side in English
          isRTL
            ? "right-0 border-l border-gray-200"
            : "left-0 border-r border-gray-200",
          // Slide animation: flip direction based on RTL
          open
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full md:translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-bold text-gray-900">{t("appName")}</span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
              {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name || session?.user?.email}</p>
              {session?.user?.isPremium ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Crown size={10} /> Premium
                </span>
              ) : (
                <span className="text-xs text-gray-400">{t("free")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, premium }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {premium && !session?.user?.isPremium && (
                  <Crown size={12} className="text-amber-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Streak widget */}
        <div className="p-3">
          <Link href="/dashboard" className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
            <Flame size={18} className="text-orange-500 flame-anim" />
            <span className="text-sm font-medium text-orange-700">{t("streak")}</span>
          </Link>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            {t("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
