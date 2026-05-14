"use client";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { Menu, Globe, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppStore();
  const isRTL = language === "ar";

  const toggleLanguage = () => setLanguage(isRTL ? "en" : "ar");

  return (
    <header
      className={cn(
        "fixed top-0 h-14 bg-white border-b border-gray-200 z-20 flex items-center px-4 gap-4",
        // In RTL: header spans from left-0 to right-64 (sidebar is on the right)
        // In LTR: header spans from left-64 to right-0 (sidebar is on the left)
        isRTL
          ? "left-0 right-0 md:right-64"
          : "right-0 left-0 md:left-64"
      )}
    >
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Globe size={16} />
        {isRTL ? "English" : "العربية"}
      </button>

      {/* Focus mode indicator */}
      <FocusModeIndicator />
    </header>
  );
}

function FocusModeIndicator() {
  const { isFocusMode, toggleFocusMode } = useAppStore();
  const { t } = useTranslation();
  if (!isFocusMode) return null;
  return (
    <button
      onClick={toggleFocusMode}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
    >
      <Zap size={14} />
      {t("focusMode")}
    </button>
  );
}
