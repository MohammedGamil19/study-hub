"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/stores/useAppStore";
import { Crown, Globe, Bell, Zap, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: session, update } = useSession();
  const { language, setLanguage, isFocusMode, toggleFocusMode } = useAppStore();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setNotifEnabled("Notification" in window && Notification.permission === "granted");
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      if ("serviceWorker" in navigator && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as any,
        });
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
      }
    }
  };

  const activatePremium = async () => {
    setUpgrading(true);
    const res = await fetch("/api/user/upgrade", { method: "POST" });
    if (res.ok) {
      setUpgradeSuccess(true);
      setToast(t("premiumActivated"));
      setTimeout(() => setToast(""), 3000);
      await update();
    }
    setUpgrading(false);
  };

  const isPremium = session?.user?.isPremium || upgradeSuccess;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50">{toast}</div>
      )}

      <h1 className="text-2xl font-bold text-gray-900">{t("settings")}</h1>

      {/* Language */}
      <Section title={t("language")} icon={<Globe size={18} className="text-indigo-500" />}>
        <div className="flex gap-3">
          <button onClick={() => setLanguage("en")}
            className={cn("flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-all", language === "en" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
            🇺🇸 English
          </button>
          <button onClick={() => setLanguage("ar")}
            className={cn("flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-all", language === "ar" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
            🇸🇦 العربية
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title={t("notifications")} icon={<Bell size={18} className="text-blue-500" />}>
        {notifEnabled ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle2 size={16} /> {t("notificationsEnabled")}
          </div>
        ) : (
          <button onClick={enableNotifications}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            {t("enableNotifications")}
          </button>
        )}
        <p className="text-xs text-gray-400 mt-2">{t("notificationsBefore")}</p>
      </Section>

      {/* Focus Mode (Premium) */}
      <Section
        title={t("focusMode")}
        icon={<Zap size={18} className={isFocusMode ? "text-indigo-600" : "text-gray-400"} />}
        badge={!isPremium ? "Premium" : undefined}
      >
        {!isPremium ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Lock size={14} /> {t("premiumFeature")}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isFocusMode ? t("focusModeOn") : t("focusModeOff")}
            </p>
            <button onClick={toggleFocusMode}
              className={cn("relative w-12 h-6 rounded-full transition-colors", isFocusMode ? "bg-indigo-600" : "bg-gray-200")}>
              <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", isFocusMode ? "left-6" : "left-0.5")} />
            </button>
          </div>
        )}
      </Section>

      {/* Premium Plan */}
      <Section
        title={isPremium ? t("premiumPlan") : t("freePlan")}
        icon={<Crown size={18} className={isPremium ? "text-amber-500" : "text-gray-400"} />}
      >
        {isPremium ? (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
              <Crown size={16} /> {t("premiumActive")}
            </div>
            <div className="space-y-1.5 text-sm text-amber-700">
              {[t("unlimitedSubjects"), t("noAds"), t("advancedAnalytics"), t("aiSummarizer"), t("focusModeFeature")].map((f) => (
                <div key={f} className="flex items-center gap-2"><CheckCircle2 size={14} /> {f}</div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">{t("premiumFeatures")}:</p>
              <div className="space-y-1.5 text-sm text-gray-500">
                {[t("unlimitedSubjects"), t("noAds"), t("advancedAnalytics"), t("aiSummarizer"), t("focusModeFeature")].map((f) => (
                  <div key={f} className="flex items-center gap-2"><Crown size={12} className="text-amber-400" /> {f}</div>
                ))}
              </div>
            </div>
            <button onClick={activatePremium} disabled={upgrading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
              <Crown size={18} /> {upgrading ? t("loading") : t("activatePremium")}
            </button>
            <p className="text-xs text-center text-gray-400">{t("demoNote")}</p>
          </div>
        )}
      </Section>

      {/* Account info */}
      <Section title={t("account")} icon={<span className="text-gray-500 text-sm">👤</span>}>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">{t("email")}:</span> {session?.user?.email}</p>
          <p><span className="font-medium">{t("name")}:</span> {session?.user?.name || "—"}</p>
          <p><span className="font-medium">{t("planLabel")}:</span> {isPremium ? `${t("premium")} ⭐` : t("free")}</p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon, badge, children }: { title: string; icon: React.ReactNode; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {badge && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
